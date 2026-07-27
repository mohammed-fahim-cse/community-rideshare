import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateMe(userId: string, dto: UpdateUserDto) {
    return this.prisma.user.update({ where: { id: userId }, data: dto });
  }

  async getPublicProfile(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Privacy: phone numbers hidden until a ride is accepted; only first name + photo in public view.
    return {
      id: user.id,
      name: user.name?.split(' ')[0] ?? null,
      photoUrl: user.photoUrl,
      phone: user.phoneVisible ? user.phone : null,
      ratingAvg: user.ratingAvg,
      ratingCount: user.ratingCount,
    };
  }
}
