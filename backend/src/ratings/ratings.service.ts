import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { RidePostStatus, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RidesService } from '../rides/rides.service';
import { CreateRatingDto } from './dto/create-rating.dto';

@Injectable()
export class RatingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rides: RidesService,
  ) {}

  async rate(user: User, rideId: string, dto: CreateRatingDto) {
    const post = await this.rides.getForParticipant(user, rideId);
    if (post.status !== RidePostStatus.COMPLETED || !post.match) {
      throw new BadRequestException('You can only rate a completed ride');
    }

    const ratedUserId = this.rides.otherParticipantId(post, user.id);
    const rideMatchId = post.match.id;

    const existing = await this.prisma.rating.findUnique({
      where: { rideMatchId_raterId: { rideMatchId, raterId: user.id } },
    });
    if (existing) {
      throw new ConflictException('You already rated this ride');
    }

    return this.prisma.$transaction(async (tx) => {
      const rating = await tx.rating.create({
        data: {
          rideMatchId,
          raterId: user.id,
          ratedUserId,
          stars: dto.stars,
          comment: dto.comment,
        },
      });

      const ratedUser = await tx.user.findUniqueOrThrow({ where: { id: ratedUserId } });
      const newCount = ratedUser.ratingCount + 1;
      const newAvg = (ratedUser.ratingAvg * ratedUser.ratingCount + dto.stars) / newCount;
      await tx.user.update({
        where: { id: ratedUserId },
        data: { ratingAvg: newAvg, ratingCount: newCount },
      });

      return rating;
    });
  }
}
