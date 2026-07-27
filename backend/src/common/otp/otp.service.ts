import { Injectable, Logger } from '@nestjs/common';
import { createHash, randomInt } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

const OTP_TTL_MINUTES = 10;

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(private readonly prisma: PrismaService) {}

  private hash(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  async generateAndSend(userId: string, phone: string): Promise<void> {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.prisma.otpCode.create({
      data: {
        userId,
        codeHash: this.hash(code),
        expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
      },
    });

    // No SMS provider wired up yet (see doc section 9: "Twilio or similar").
    // Logging the code here so the auth flow is testable end-to-end before that's plugged in.
    this.logger.log(`OTP for ${phone}: ${code}`);
  }

  async verify(userId: string, code: string): Promise<boolean> {
    const candidate = await this.prisma.otpCode.findFirst({
      where: {
        userId,
        consumed: false,
        expiresAt: { gt: new Date() },
        codeHash: this.hash(code),
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!candidate) {
      return false;
    }

    await this.prisma.otpCode.update({
      where: { id: candidate.id },
      data: { consumed: true },
    });

    return true;
  }
}
