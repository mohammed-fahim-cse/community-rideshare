import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toPublicUser } from '../common/users/public-user.util';

@Injectable()
export class BlocksService {
  constructor(private readonly prisma: PrismaService) {}

  async block(user: User, blockedUserId: string) {
    if (blockedUserId === user.id) {
      throw new BadRequestException('You cannot block yourself');
    }

    const target = await this.prisma.user.findUnique({ where: { id: blockedUserId } });
    if (!target || target.communityId !== user.communityId) {
      throw new NotFoundException('Member not found');
    }

    await this.prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: user.id, blockedId: blockedUserId } },
      update: {},
      create: { blockerId: user.id, blockedId: blockedUserId },
    });

    return { message: 'Blocked' };
  }

  async unblock(user: User, blockedUserId: string) {
    await this.prisma.block.deleteMany({ where: { blockerId: user.id, blockedId: blockedUserId } });
    return { message: 'Unblocked' };
  }

  async list(user: User) {
    const blocks = await this.prisma.block.findMany({
      where: { blockerId: user.id },
      include: { blocked: true },
    });
    return blocks.map((b) => toPublicUser(b.blocked));
  }
}
