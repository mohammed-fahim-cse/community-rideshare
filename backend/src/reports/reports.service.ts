import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: User, dto: CreateReportDto) {
    if (dto.reportedUserId === user.id) {
      throw new BadRequestException('You cannot report yourself');
    }

    const reportedUser = await this.prisma.user.findUnique({ where: { id: dto.reportedUserId } });
    if (!reportedUser || reportedUser.communityId !== user.communityId) {
      throw new NotFoundException('Member not found');
    }

    if (dto.rideMatchId) {
      const match = await this.prisma.rideMatch.findUnique({
        where: { id: dto.rideMatchId },
        include: { ridePost: true },
      });
      const participantIds = match ? [match.ridePost.creatorId, match.acceptedByUserId] : [];
      if (!match || !participantIds.includes(user.id)) {
        throw new BadRequestException('rideMatchId does not correspond to a ride you were part of');
      }
    }

    return this.prisma.report.create({
      data: {
        reporterId: user.id,
        reportedUserId: dto.reportedUserId,
        reason: dto.reason,
        rideMatchId: dto.rideMatchId,
      },
    });
  }
}
