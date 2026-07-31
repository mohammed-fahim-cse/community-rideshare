import { Logger, ValidationPipe, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.init();
  return app;
}

export async function resetDatabase(prisma: PrismaService): Promise<void> {
  // TRUNCATE ... CASCADE ignores FK RESTRICT/NO ACTION, unlike per-row deletes — the
  // simplest full wipe between tests given the schema doesn't define cascading deletes.
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE communities, users, otp_codes, ride_posts, ride_matches, ratings, messages, reports, blocks, device_tokens RESTART IDENTITY CASCADE;',
  );
}

// Fictional NANP numbers (exchange 555, subscriber 0100-0199) are the only "555" range
// libphonenumber-js accepts as valid across every area code, so this is deliberately
// scoped to that same block confirmed valid during manual testing.
const AREA_CODES = ['201', '202', '212', '312', '415', '512', '617', '702', '818', '919'];
let phoneCounter = 0;

export function nextTestPhone(): string {
  const n = phoneCounter++;
  const area = AREA_CODES[Math.floor(n / 100) % AREA_CODES.length];
  const suffix = (100 + (n % 100)).toString().padStart(4, '0');
  return `+1${area}555${suffix}`;
}

export function installOtpCapture() {
  const messages: string[] = [];
  const spy = jest.spyOn(Logger.prototype, 'log').mockImplementation(function mockLog(message: unknown) {
    messages.push(String(message));
  });

  return {
    latestOtpFor(phone: string): string {
      const matching = messages.filter((m) => m.includes(`OTP for ${phone}:`));
      const last = matching[matching.length - 1];
      if (!last) {
        throw new Error(`No OTP was logged for ${phone}`);
      }
      // Anchored to the end of the line — the phone number itself contains runs of 6+
      // digits, so an unanchored /\d{6}/ can match inside the phone instead of the code.
      const match = last.match(/(\d{6})\s*$/);
      if (!match) {
        throw new Error(`Could not parse an OTP out of: ${last}`);
      }
      return match[1];
    },
    restore() {
      spy.mockRestore();
    },
  };
}

export interface SignedUpMember {
  accessToken: string;
  userId: string;
  phone: string;
}

// Signs a fresh member up against `inviteCode` and carries them through OTP verification,
// exactly like the mobile join flow — used as setup for tests that need an already-active
// member rather than being the thing under test.
export async function signUpAndVerify(
  app: INestApplication,
  otp: ReturnType<typeof installOtpCapture>,
  inviteCode: string,
  phone = nextTestPhone(),
): Promise<SignedUpMember> {
  await request(app.getHttpServer()).post('/auth/signup').send({ phone, inviteCode }).expect(201);
  const code = otp.latestOtpFor(phone);
  const res = await request(app.getHttpServer()).post('/auth/verify-otp').send({ phone, code }).expect(201);
  return { accessToken: res.body.accessToken, userId: res.body.user.id, phone };
}
