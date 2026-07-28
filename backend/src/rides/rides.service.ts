import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RidePostStatus, RidePostType, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toPublicUser } from '../common/users/public-user.util';
import { haversineKm } from '../common/geo/haversine';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { RideEvents } from '../realtime/events';
import { CreateRidePostDto } from './dto/create-ride-post.dto';
import { ListRidesDto } from './dto/list-rides.dto';
import { CancelRideDto } from './dto/cancel-ride.dto';

const rideWithMatchInclude = {
  creator: true,
  match: { include: { acceptedBy: true } },
} satisfies Prisma.RidePostInclude;

export type RideWithMatch = Prisma.RidePostGetPayload<{ include: typeof rideWithMatchInclude }>;

@Injectable()
export class RidesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async create(user: User, dto: CreateRidePostDto) {
    const post = await this.prisma.ridePost.create({
      data: {
        type: dto.type,
        mode: dto.mode,
        creatorId: user.id,
        pickupLat: dto.pickupLat,
        pickupLng: dto.pickupLng,
        pickupAddress: dto.pickupAddress,
        destinationLat: dto.destinationLat,
        destinationLng: dto.destinationLng,
        destinationAddress: dto.destinationAddress,
        scheduledTime: dto.scheduledTime ? new Date(dto.scheduledTime) : null,
        seatsAvailable: dto.type === RidePostType.OFFER ? dto.seatsAvailable : null,
        suggestedFare: dto.suggestedFare,
      },
      include: rideWithMatchInclude,
    });

    // Broadcast with viewerId=null so nobody's phone leaks to the whole community feed.
    this.realtime.emitToCommunity(user.communityId, RideEvents.NEW, this.shape(post, null));

    return this.shape(post, user.id);
  }

  async list(user: User, query: ListRidesDto) {
    const blocks = await this.prisma.block.findMany({
      where: { OR: [{ blockerId: user.id }, { blockedId: user.id }] },
    });
    const excludedCreatorIds = new Set<string>([user.id]);
    for (const b of blocks) {
      excludedCreatorIds.add(b.blockerId);
      excludedCreatorIds.add(b.blockedId);
    }

    const where: Prisma.RidePostWhereInput = {
      status: query.status ?? RidePostStatus.OPEN,
      creator: { communityId: user.communityId },
      creatorId: { notIn: [...excludedCreatorIds] },
      ...(query.mode ? { mode: query.mode } : {}),
      ...(query.type ? { type: query.type } : {}),
    };

    let posts = await this.prisma.ridePost.findMany({
      where,
      include: rideWithMatchInclude,
      orderBy: { createdAt: 'desc' },
    });

    if (query.near) {
      const [latStr, lngStr] = query.near.split(',');
      const lat = Number(latStr);
      const lng = Number(lngStr);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        throw new BadRequestException('near must be in the form "lat,lng"');
      }

      const radiusKm = query.radiusKm ?? (await this.getCommunityRadiusKm(user.communityId));
      posts = posts
        .map((post) => ({ post, distanceKm: haversineKm(lat, lng, post.pickupLat, post.pickupLng) }))
        .filter(({ distanceKm }) => distanceKm <= radiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .map(({ post }) => post);
    }

    return posts.map((post) => this.shape(post, user.id));
  }

  async getOne(user: User, id: string) {
    const post = await this.findOrThrow(id);
    this.assertSameCommunity(post, user);
    return this.shape(post, user.id);
  }

  // Rides the user is party to as either creator or acceptor, any status — for the
  // ride history screen. Unlike list(), this deliberately does NOT exclude the user's
  // own posts, since that's the whole point here.
  async listMine(user: User) {
    const posts = await this.prisma.ridePost.findMany({
      where: {
        OR: [{ creatorId: user.id }, { match: { acceptedByUserId: user.id } }],
      },
      include: {
        creator: true,
        match: { include: { acceptedBy: true, ratings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return posts.map((post) => ({
      ...this.shape(post, user.id),
      myRating: post.match?.ratings.find((r) => r.raterId === user.id)?.stars ?? null,
      theirRating: post.match?.ratings.find((r) => r.ratedUserId === user.id)?.stars ?? null,
    }));
  }

  async accept(user: User, id: string) {
    const post = await this.findOrThrow(id);
    this.assertSameCommunity(post, user);

    if (post.creatorId === user.id) {
      throw new BadRequestException('You cannot accept your own ride post');
    }
    if (post.status !== RidePostStatus.OPEN) {
      throw new ConflictException('This ride is no longer available');
    }
    await this.assertNotBlocked(user.id, post.creatorId);

    // Conditional update guards against two members accepting the same OPEN post at once.
    const result = await this.prisma.ridePost.updateMany({
      where: { id, status: RidePostStatus.OPEN },
      data: { status: RidePostStatus.ACCEPTED },
    });
    if (result.count === 0) {
      throw new ConflictException('This ride was just taken by someone else');
    }

    await this.prisma.rideMatch.create({
      data: { ridePostId: id, acceptedByUserId: user.id },
    });

    const updated = await this.getOne(user, id);
    // Both participants see the same (fully revealed) shape, so this is valid for the creator too.
    this.realtime.emitToUser(post.creatorId, RideEvents.ACCEPTED, updated);
    this.realtime.emitToCommunity(user.communityId, RideEvents.TAKEN, { rideId: id });
    return updated;
  }

  async arrived(user: User, id: string) {
    const post = await this.findOrThrow(id);
    this.assertSameCommunity(post, user);

    if (!post.match) {
      throw new BadRequestException('This ride has not been accepted yet');
    }
    if (post.status !== RidePostStatus.ACCEPTED) {
      throw new ConflictException(`Cannot mark arrived from status ${post.status}`);
    }
    if (this.driverId(post) !== user.id) {
      throw new ForbiddenException('Only the driver can mark arrival at pickup');
    }

    await this.prisma.$transaction([
      this.prisma.ridePost.update({ where: { id }, data: { status: RidePostStatus.IN_PROGRESS } }),
      this.prisma.rideMatch.update({ where: { id: post.match.id }, data: { arrivedAt: new Date() } }),
    ]);

    const updated = await this.getOne(user, id);
    this.realtime.emitToUser(this.otherParticipantId(post, user.id), RideEvents.ARRIVED, updated);
    return updated;
  }

  async complete(user: User, id: string) {
    const post = await this.findOrThrow(id);
    this.assertSameCommunity(post, user);

    if (!post.match) {
      throw new BadRequestException('This ride has not been accepted yet');
    }
    if (post.status !== RidePostStatus.IN_PROGRESS) {
      throw new ConflictException(`Cannot complete from status ${post.status}`);
    }
    this.assertParticipant(post, user.id);

    await this.prisma.$transaction([
      this.prisma.ridePost.update({ where: { id }, data: { status: RidePostStatus.COMPLETED } }),
      this.prisma.rideMatch.update({ where: { id: post.match.id }, data: { completedAt: new Date() } }),
    ]);

    const updated = await this.getOne(user, id);
    this.realtime.emitToUser(this.otherParticipantId(post, user.id), RideEvents.COMPLETED, updated);
    return updated;
  }

  async cancel(user: User, id: string, dto: CancelRideDto) {
    const post = await this.findOrThrow(id);
    this.assertSameCommunity(post, user);

    if (post.status === RidePostStatus.COMPLETED || post.status === RidePostStatus.CANCELLED) {
      throw new ConflictException(`Cannot cancel a ride that is already ${post.status.toLowerCase()}`);
    }

    let otherParticipantId: string | undefined;

    if (!post.match) {
      if (post.creatorId !== user.id) {
        throw new ForbiddenException('Only the creator can cancel before it is accepted');
      }
      await this.prisma.ridePost.update({ where: { id }, data: { status: RidePostStatus.CANCELLED } });
    } else {
      this.assertParticipant(post, user.id);
      if (!dto.reason?.trim()) {
        throw new BadRequestException('A cancellation reason is required once a ride has been accepted');
      }
      otherParticipantId = this.otherParticipantId(post, user.id);
      await this.prisma.$transaction([
        this.prisma.ridePost.update({ where: { id }, data: { status: RidePostStatus.CANCELLED } }),
        this.prisma.rideMatch.update({
          where: { id: post.match.id },
          data: { cancelledAt: new Date(), cancelReason: dto.reason },
        }),
      ]);
    }

    const updated = await this.getOne(user, id);
    if (otherParticipantId) {
      // "Notifies the other party immediately" (doc section 3.4, step 5).
      this.realtime.emitToUser(otherParticipantId, RideEvents.CANCELLED, updated);
    }
    this.realtime.emitToCommunity(user.communityId, RideEvents.CANCELLED, { rideId: id });
    return updated;
  }

  // Shared by chat/ratings/reports: fetches a ride post, scoped to the same community,
  // and confirms the requesting user is actually one of its two participants.
  async getForParticipant(user: User, id: string): Promise<RideWithMatch> {
    const post = await this.findOrThrow(id);
    this.assertSameCommunity(post, user);
    this.assertParticipant(post, user.id);
    return post;
  }

  otherParticipantId(post: RideWithMatch, viewerId: string): string {
    const otherId = post.creatorId === viewerId ? post.match?.acceptedByUserId : post.creatorId;
    if (!otherId) {
      throw new BadRequestException('This ride has no other participant yet');
    }
    return otherId;
  }

  private async findOrThrow(id: string): Promise<RideWithMatch> {
    const post = await this.prisma.ridePost.findUnique({ where: { id }, include: rideWithMatchInclude });
    if (!post) {
      throw new NotFoundException('Ride post not found');
    }
    return post;
  }

  private assertSameCommunity(post: RideWithMatch, user: User) {
    if (post.creator.communityId !== user.communityId) {
      throw new NotFoundException('Ride post not found');
    }
  }

  private assertParticipant(post: RideWithMatch, userId: string) {
    const participantIds = [post.creatorId, post.match?.acceptedByUserId];
    if (!participantIds.includes(userId)) {
      throw new ForbiddenException('You are not a participant in this ride');
    }
  }

  private async assertNotBlocked(userAId: string, userBId: string) {
    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userAId, blockedId: userBId },
          { blockerId: userBId, blockedId: userAId },
        ],
      },
    });
    if (block) {
      throw new ForbiddenException('You cannot match with this member');
    }
  }

  private async getCommunityRadiusKm(communityId: string): Promise<number> {
    const community = await this.prisma.community.findUniqueOrThrow({ where: { id: communityId } });
    return community.matchingRadiusKm;
  }

  // For a REQUEST, the creator is the rider and whoever accepts is the driver; for an
  // OFFER it's reversed (the creator posted seats and is driving).
  private driverId(post: RideWithMatch): string | undefined {
    return post.type === RidePostType.REQUEST ? post.match?.acceptedByUserId : post.creatorId;
  }

  private shape(post: RideWithMatch, viewerId: string | null) {
    const isParticipant =
      viewerId !== null && (viewerId === post.creatorId || viewerId === post.match?.acceptedByUserId);

    return {
      id: post.id,
      type: post.type,
      mode: post.mode,
      status: post.status,
      pickupLat: post.pickupLat,
      pickupLng: post.pickupLng,
      pickupAddress: post.pickupAddress,
      destinationLat: post.destinationLat,
      destinationLng: post.destinationLng,
      destinationAddress: post.destinationAddress,
      scheduledTime: post.scheduledTime,
      seatsAvailable: post.seatsAvailable,
      suggestedFare: post.suggestedFare,
      createdAt: post.createdAt,
      creator: toPublicUser(post.creator, isParticipant),
      match: post.match
        ? {
            id: post.match.id,
            acceptedAt: post.match.acceptedAt,
            arrivedAt: post.match.arrivedAt,
            completedAt: post.match.completedAt,
            cancelledAt: post.match.cancelledAt,
            cancelReason: post.match.cancelReason,
            acceptedBy: toPublicUser(post.match.acceptedBy, isParticipant),
          }
        : null,
    };
  }
}
