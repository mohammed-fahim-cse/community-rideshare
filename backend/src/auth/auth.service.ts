import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from '../common/otp/otp.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otp: OtpService,
    private readonly jwt: JwtService,
  ) {}

  async signup({ phone, inviteCode }: SignupDto) {
    const community = await this.prisma.community.findUnique({
      where: { inviteCode },
    });
    if (!community) {
      throw new NotFoundException('Invalid invite code');
    }

    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (user) {
      throw new BadRequestException('Phone number is already registered');
    }

    user = await this.prisma.user.create({
      data: {
        phone,
        communityId: community.id,
        status: community.autoApprove ? UserStatus.ACTIVE : UserStatus.PENDING,
      },
    });

    await this.otp.generateAndSend(user.id, phone);
    return { message: 'OTP sent' };
  }

  async login({ phone }: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      throw new NotFoundException('No account for this phone number. Please sign up first.');
    }

    await this.otp.generateAndSend(user.id, phone);
    return { message: 'OTP sent' };
  }

  async verifyOtp({ phone, code }: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      throw new NotFoundException('No account for this phone number');
    }

    const valid = await this.otp.verify(user.id, code);
    if (!valid) {
      throw new UnauthorizedException('Invalid or expired code');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('This account has been suspended');
    }

    const accessToken = await this.jwt.signAsync({ sub: user.id });
    return {
      accessToken,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        status: user.status,
        communityId: user.communityId,
      },
    };
  }
}
