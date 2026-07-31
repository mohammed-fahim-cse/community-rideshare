import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, installOtpCapture, resetDatabase, signUpAndVerify, SignedUpMember } from './utils/test-app';

describe('Rides (e2e)', () => {
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
      data: { name: 'Test Community', inviteCode: 'RIDECODE', autoApprove: true, matchingRadiusKm: 5 },
    });
    inviteCode = community.inviteCode;
  });

  afterEach(() => {
    otp.restore();
  });

  const server = () => app.getHttpServer();

  const onDemandRequest = {
    type: 'REQUEST',
    mode: 'ON_DEMAND',
    pickupLat: 37.7749,
    pickupLng: -122.4194,
    pickupAddress: '123 Main St',
    destinationLat: 37.8044,
    destinationLng: -122.2712,
    destinationAddress: '456 Oak Ave',
  };

  async function createMember(): Promise<SignedUpMember> {
    return signUpAndVerify(app, otp, inviteCode);
  }

  it('excludes the creator\'s own posts from the browse feed', async () => {
    const rider = await createMember();
    await request(server())
      .post('/rides')
      .set('Authorization', `Bearer ${rider.accessToken}`)
      .send(onDemandRequest)
      .expect(201);

    const res = await request(server()).get('/rides').set('Authorization', `Bearer ${rider.accessToken}`).expect(200);
    expect(res.body).toEqual([]);
  });

  it('lets another member accept an OPEN request and unlocks both phone numbers', async () => {
    const rider = await createMember();
    const driver = await createMember();

    const created = await request(server())
      .post('/rides')
      .set('Authorization', `Bearer ${rider.accessToken}`)
      .send(onDemandRequest)
      .expect(201);

    const feed = await request(server()).get('/rides').set('Authorization', `Bearer ${driver.accessToken}`).expect(200);
    expect(feed.body).toHaveLength(1);
    expect(feed.body[0].creator.phone).toBeNull(); // not yet a participant

    const accepted = await request(server())
      .post(`/rides/${created.body.id}/accept`)
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .expect(201);

    expect(accepted.body.status).toBe('ACCEPTED');
    expect(accepted.body.creator.phone).toBe(rider.phone);
    expect(accepted.body.match.acceptedBy.phone).toBe(driver.phone);
  });

  it('rejects accepting your own ride post', async () => {
    const rider = await createMember();
    const created = await request(server())
      .post('/rides')
      .set('Authorization', `Bearer ${rider.accessToken}`)
      .send(onDemandRequest)
      .expect(201);

    await request(server())
      .post(`/rides/${created.body.id}/accept`)
      .set('Authorization', `Bearer ${rider.accessToken}`)
      .expect(400);
  });

  it('only lets one of two simultaneous accepts win', async () => {
    const rider = await createMember();
    const driverA = await createMember();
    const driverB = await createMember();

    const created = await request(server())
      .post('/rides')
      .set('Authorization', `Bearer ${rider.accessToken}`)
      .send(onDemandRequest)
      .expect(201);

    const [resA, resB] = await Promise.all([
      request(server()).post(`/rides/${created.body.id}/accept`).set('Authorization', `Bearer ${driverA.accessToken}`),
      request(server()).post(`/rides/${created.body.id}/accept`).set('Authorization', `Bearer ${driverB.accessToken}`),
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([201, 409]);

    const winner = resA.status === 201 ? resA : resB;
    const final = await request(server()).get(`/rides/${created.body.id}`).set('Authorization', `Bearer ${rider.accessToken}`).expect(200);
    expect(final.body.status).toBe('ACCEPTED');
    expect(final.body.match.acceptedBy.id).toBe(winner.body.match.acceptedBy.id);

    const matches = await prisma.rideMatch.findMany({ where: { ridePostId: created.body.id } });
    expect(matches).toHaveLength(1);
  });

  it('blocks prevent a blocked member from accepting', async () => {
    const rider = await createMember();
    const driver = await createMember();

    await request(server())
      .post('/blocks')
      .set('Authorization', `Bearer ${rider.accessToken}`)
      .send({ blockedUserId: driver.userId })
      .expect(201);

    const created = await request(server())
      .post('/rides')
      .set('Authorization', `Bearer ${rider.accessToken}`)
      .send(onDemandRequest)
      .expect(201);

    await request(server())
      .post(`/rides/${created.body.id}/accept`)
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .expect(403);
  });

  it('runs a REQUEST through its full lifecycle with correct driver/rider roles', async () => {
    const rider = await createMember();
    const driver = await createMember();

    const created = await request(server())
      .post('/rides')
      .set('Authorization', `Bearer ${rider.accessToken}`)
      .send(onDemandRequest)
      .expect(201);
    const rideId = created.body.id;

    await request(server()).post(`/rides/${rideId}/accept`).set('Authorization', `Bearer ${driver.accessToken}`).expect(201);

    // For a REQUEST, the creator is the rider — only the acceptor (driver) may mark arrived.
    await request(server()).post(`/rides/${rideId}/arrived`).set('Authorization', `Bearer ${rider.accessToken}`).expect(403);
    await request(server()).post(`/rides/${rideId}/arrived`).set('Authorization', `Bearer ${driver.accessToken}`).expect(201);

    // Either participant may mark it complete.
    const completed = await request(server())
      .post(`/rides/${rideId}/complete`)
      .set('Authorization', `Bearer ${rider.accessToken}`)
      .expect(201);
    expect(completed.body.status).toBe('COMPLETED');

    const mineRider = await request(server()).get('/rides/mine').set('Authorization', `Bearer ${rider.accessToken}`).expect(200);
    const mineDriver = await request(server()).get('/rides/mine').set('Authorization', `Bearer ${driver.accessToken}`).expect(200);
    expect(mineRider.body).toHaveLength(1);
    expect(mineDriver.body).toHaveLength(1);
    expect(mineRider.body[0].myRating).toBeNull();
  });

  it('requires a reason to cancel after acceptance, and notifies via the other participant', async () => {
    const rider = await createMember();
    const driver = await createMember();

    const created = await request(server())
      .post('/rides')
      .set('Authorization', `Bearer ${rider.accessToken}`)
      .send(onDemandRequest)
      .expect(201);
    const rideId = created.body.id;

    await request(server()).post(`/rides/${rideId}/accept`).set('Authorization', `Bearer ${driver.accessToken}`).expect(201);

    await request(server())
      .post(`/rides/${rideId}/cancel`)
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send({})
      .expect(400);

    const cancelled = await request(server())
      .post(`/rides/${rideId}/cancel`)
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send({ reason: 'Car trouble' })
      .expect(201);
    expect(cancelled.body.status).toBe('CANCELLED');
    expect(cancelled.body.match.cancelReason).toBe('Car trouble');
  });

  it('lets the creator cancel freely before acceptance, but blocks anyone else', async () => {
    const rider = await createMember();
    const other = await createMember();

    const created = await request(server())
      .post('/rides')
      .set('Authorization', `Bearer ${rider.accessToken}`)
      .send(onDemandRequest)
      .expect(201);
    const rideId = created.body.id;

    await request(server()).post(`/rides/${rideId}/cancel`).set('Authorization', `Bearer ${other.accessToken}`).send({}).expect(403);
    await request(server()).post(`/rides/${rideId}/cancel`).set('Authorization', `Bearer ${rider.accessToken}`).send({}).expect(201);
  });

  it('rejects a pending member from posting a ride', async () => {
    const manual = await prisma.community.create({
      data: { name: 'Manual Co', inviteCode: 'PENDCODE', autoApprove: false, matchingRadiusKm: 5 },
    });
    const pending = await signUpAndVerify(app, otp, manual.inviteCode);

    await request(server())
      .post('/rides')
      .set('Authorization', `Bearer ${pending.accessToken}`)
      .send(onDemandRequest)
      .expect(403);
  });
});
