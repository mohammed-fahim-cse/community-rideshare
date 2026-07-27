import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDeviceDto } from './dto/register-device.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async registerDevice(user: User, dto: RegisterDeviceDto) {
    // Upsert by token: the same physical device re-registering (app restart, or a
    // different member logging in on it) should just move the token, not duplicate it.
    await this.prisma.deviceToken.upsert({
      where: { token: dto.token },
      update: { userId: user.id, platform: dto.platform },
      create: { userId: user.id, token: dto.token, platform: dto.platform },
    });

    return { message: 'Device registered' };
  }
}
