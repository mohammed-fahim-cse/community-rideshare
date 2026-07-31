import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, installOtpCapture, nextTestPhone, resetDatabase } from './utils/test-app';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let otp: ReturnType<typeof installOtpCapture>;
  let community: { id: string; inviteCode: string };

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    otp = installOtpCapture();
    community = await prisma.community.create({
      data: { name: 'Test Community', inviteCode: 'TESTCODE', autoApprove: true, matchingRadiusKm: 5 },
    });
  });

  afterEach(() => {
    otp.restore();
  });

  it('rejects signup with an invalid invite code', async () => {
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ phone: nextTestPhone(), inviteCode: 'NOPE0000' })
      .expect(404);
  });

  it('signs up, verifies OTP, and lands ACTIVE when the community auto-approves', async () => {
    const phone = nextTestPhone();
    await request(app.getHttpServer()).post('/auth/signup').send({ phone, inviteCode: community.inviteCode }).expect(201);

    const code = otp.latestOtpFor(phone);
    const res = await request(app.getHttpServer()).post('/auth/verify-otp').send({ phone, code }).expect(201);

    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ phone, status: 'ACTIVE' });
  });

  it('lands PENDING when the community does not auto-approve', async () => {
    const manual = await prisma.community.create({
      data: { name: 'Manual Approval Co', inviteCode: 'MANUAL01', autoApprove: false, matchingRadiusKm: 5 },
    });
    const phone = nextTestPhone();
    await request(app.getHttpServer()).post('/auth/signup').send({ phone, inviteCode: manual.inviteCode }).expect(201);

    const code = otp.latestOtpFor(phone);
    const res = await request(app.getHttpServer()).post('/auth/verify-otp').send({ phone, code }).expect(201);

    expect(res.body.user.status).toBe('PENDING');
  });

  it('rejects verify-otp with the wrong code', async () => {
    const phone = nextTestPhone();
    await request(app.getHttpServer()).post('/auth/signup').send({ phone, inviteCode: community.inviteCode }).expect(201);

    await request(app.getHttpServer()).post('/auth/verify-otp').send({ phone, code: '000000' }).expect(401);
  });

  it('rejects a code that was already consumed', async () => {
    const phone = nextTestPhone();
    await request(app.getHttpServer()).post('/auth/signup').send({ phone, inviteCode: community.inviteCode }).expect(201);
    const code = otp.latestOtpFor(phone);

    await request(app.getHttpServer()).post('/auth/verify-otp').send({ phone, code }).expect(201);
    await request(app.getHttpServer()).post('/auth/verify-otp').send({ phone, code }).expect(401);
  });

  it('rejects login for a suspended account', async () => {
    const phone = nextTestPhone();
    await request(app.getHttpServer()).post('/auth/signup').send({ phone, inviteCode: community.inviteCode }).expect(201);
    const code = otp.latestOtpFor(phone);
    await request(app.getHttpServer()).post('/auth/verify-otp').send({ phone, code }).expect(201);

    await prisma.user.update({ where: { phone }, data: { status: 'SUSPENDED' } });

    await request(app.getHttpServer()).post('/auth/login').send({ phone }).expect(201);
    const suspendedCode = otp.latestOtpFor(phone);
    await request(app.getHttpServer()).post('/auth/verify-otp').send({ phone, code: suspendedCode }).expect(401);
  });

  it('rejects a malformed phone number before it ever reaches the database', async () => {
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ phone: 'not-a-phone', inviteCode: community.inviteCode })
      .expect(400);
  });
});
