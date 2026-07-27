import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { RidePostStatus, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RidesService, RideWithMatch } from '../rides/rides.service';
import { CreateMessageDto } from './dto/create-message.dto';

const CHAT_ARCHIVE_HOURS = 24;

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rides: RidesService,
  ) {}

  async listMessages(user: User, rideId: string) {
    const post = await this.getAcceptedRideOrThrow(user, rideId);
    return this.prisma.message.findMany({
      where: { rideMatchId: post.match!.id },
      orderBy: { sentAt: 'asc' },
    });
  }

  async sendMessage(user: User, rideId: string, dto: CreateMessageDto) {
    const post = await this.getAcceptedRideOrThrow(user, rideId);
    if (!this.isOpenForNewMessages(post)) {
      throw new ForbiddenException('Chat is closed for this ride');
    }

    return this.prisma.message.create({
      data: { rideMatchId: post.match!.id, senderId: user.id, text: dto.text },
    });
  }

  private async getAcceptedRideOrThrow(user: User, rideId: string): Promise<RideWithMatch> {
    const post = await this.rides.getForParticipant(user, rideId);
    if (!post.match) {
      throw new NotFoundException('This ride has not been accepted yet');
    }
    return post;
  }

  // Chat unlocks on acceptance and auto-closes some time after completion (doc section 3.6).
  private isOpenForNewMessages(post: RideWithMatch): boolean {
    if (!post.match) {
      return false;
    }
    if (post.status === RidePostStatus.ACCEPTED || post.status === RidePostStatus.IN_PROGRESS) {
      return true;
    }
    if (post.status === RidePostStatus.COMPLETED && post.match.completedAt) {
      const hoursSinceCompletion = (Date.now() - post.match.completedAt.getTime()) / 3_600_000;
      return hoursSinceCompletion < CHAT_ARCHIVE_HOURS;
    }
    return false;
  }
}
