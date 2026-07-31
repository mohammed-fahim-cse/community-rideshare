import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, installOtpCapture, resetDatabase, signUpAndVerify } from './utils/test-app';

describe('Admin (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let otp: ReturnType<typeof installOtpCapture>;
  let inviteCode: string;

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
    const community = await prisma.community.create({
      data: { name: 'Admin Test Co', inviteCode: 'ADMCODE1', autoApprove: false, matchingRadiusKm: 5 },
    });
    inviteCode = community.inviteCode;
  });

  afterEach(() => {
    otp.restore();
  });

  const server = () => app.getHttpServer();

  it('rejects a regular member from every admin endpoint', async () => {
    const member = await signUpAndVerify(app, otp, inviteCode);
    await prisma.user.update({ where: { id: member.userId }, data: { status: 'ACTIVE' } });

    await request(server()).get('/admin/members').set('Authorization', `Bearer ${member.accessToken}`).expect(403);
    await request(server()).get('/admin/reports').set('Authorization', `Bearer ${member.accessToken}`).expect(403);
    await request(server()).get('/admin/rides').set('Authorization', `Bearer ${member.accessToken}`).expect(403);
    await request(server()).get('/admin/community').set('Authorization', `Bearer ${member.accessToken}`).expect(403);
  });

  it('lets an admin approve a pending member, and only once', async () => {
    const admin = await signUpAndVerify(app, otp, inviteCode);
    await prisma.user.update({ where: { id: admin.userId }, data: { status: 'ACTIVE', role: 'ADMIN' } });
    const pending = await signUpAndVerify(app, otp, inviteCode);

    const queue = await request(server()).get('/admin/members?status=PENDING').set('Authorization', `Bearer ${admin.accessToken}`).expect(200);
    expect(queue.body).toHaveLength(1);
    expect(queue.body[0].id).toBe(pending.userId);

    await request(server())
      .post(`/admin/members/${pending.userId}/approve`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(201);

    await request(server())
      .post(`/admin/members/${pending.userId}/approve`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(409);

    const activeMember = await prisma.user.findUniqueOrThrow({ where: { id: pending.userId } });
    expect(activeMember.status).toBe('ACTIVE');
  });

  it('suspending a reported member via the report queue blocks their next ride action', async () => {
    const admin = await signUpAndVerify(app, otp, inviteCode);
    await prisma.user.update({ where: { id: admin.userId }, data: { status: 'ACTIVE', role: 'ADMIN' } });
    const reporter = await signUpAndVerify(app, otp, inviteCode);
    const reported = await signUpAndVerify(app, otp, inviteCode);
    await prisma.user.updateMany({ where: { id: { in: [reporter.userId, reported.userId] } }, data: { status: 'ACTIVE' } });

    const report = await request(server())
      .post('/reports')
      .set('Authorization', `Bearer ${reporter.accessToken}`)
      .send({ reportedUserId: reported.userId, reason: 'Rude and late' })
      .expect(201);

    await request(server())
      .post(`/admin/reports/${report.body.id}/action`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ action: 'SUSPEND' })
      .expect(201);

    const suspended = await prisma.user.findUniqueOrThrow({ where: { id: reported.userId } });
    expect(suspended.status).toBe('SUSPENDED');

    await request(server())
      .post('/rides')
      .set('Authorization', `Bearer ${reported.accessToken}`)
      .send({
        type: 'REQUEST',
        mode: 'ON_DEMAND',
        pickupLat: 1,
        pickupLng: 1,
        pickupAddress: 'a',
        destinationLat: 2,
        destinationLng: 2,
        destinationAddress: 'b',
      })
      .expect(403);
  });

  it('lets an admin update community settings', async () => {
    const admin = await signUpAndVerify(app, otp, inviteCode);
    await prisma.user.update({ where: { id: admin.userId }, data: { status: 'ACTIVE', role: 'ADMIN' } });

    const updated = await request(server())
      .patch('/admin/community')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ matchingRadiusKm: 12.5, autoApprove: true })
      .expect(200);

    expect(updated.body.matchingRadiusKm).toBe(12.5);
    expect(updated.body.autoApprove).toBe(true);
  });
});
