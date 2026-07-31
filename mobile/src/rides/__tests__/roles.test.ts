import { describe, expect, it } from '@jest/globals';
import { getDriver, getOtherParticipant, getRider, isDriver } from '../roles';
import type { PublicUser, RidePost } from '../../api/types';

function user(id: string): PublicUser {
  return { id, name: id, photoUrl: null, phone: null, ratingAvg: 0, ratingCount: 0 };
}

function ride(overrides: Partial<RidePost>): RidePost {
  return {
    id: 'ride-1',
    type: 'REQUEST',
    mode: 'ON_DEMAND',
    status: 'OPEN',
    pickupLat: 0,
    pickupLng: 0,
    pickupAddress: 'a',
    destinationLat: 0,
    destinationLng: 0,
    destinationAddress: 'b',
    scheduledTime: null,
    seatsAvailable: null,
    suggestedFare: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    creator: user('creator'),
    match: null,
    ...overrides,
  };
}

describe('rides/roles', () => {
  const creator = user('creator');
  const acceptor = user('acceptor');
  const match = {
    id: 'match-1',
    acceptedAt: '2026-01-01T00:00:00.000Z',
    arrivedAt: null,
    completedAt: null,
    cancelledAt: null,
    cancelReason: null,
    acceptedBy: acceptor,
  };

  it('with no match, every role lookup returns null', () => {
    const r = ride({ creator, match: null });
    expect(getDriver(r)).toBeNull();
    expect(getRider(r)).toBeNull();
    expect(getOtherParticipant(r, creator.id)).toBeNull();
  });

  it('for a REQUEST, the creator is the rider and the acceptor is the driver', () => {
    const r = ride({ type: 'REQUEST', creator, match });
    expect(getDriver(r)).toBe(acceptor);
    expect(getRider(r)).toBe(creator);
    expect(isDriver(r, acceptor.id)).toBe(true);
    expect(isDriver(r, creator.id)).toBe(false);
  });

  it('for an OFFER, the roles are reversed — the creator posted seats and is driving', () => {
    const r = ride({ type: 'OFFER', creator, match });
    expect(getDriver(r)).toBe(creator);
    expect(getRider(r)).toBe(acceptor);
    expect(isDriver(r, creator.id)).toBe(true);
    expect(isDriver(r, acceptor.id)).toBe(false);
  });

  it('getOtherParticipant returns whichever participant the viewer is not, and null for a bystander', () => {
    const r = ride({ creator, match });
    expect(getOtherParticipant(r, creator.id)).toBe(acceptor);
    expect(getOtherParticipant(r, acceptor.id)).toBe(creator);
    expect(getOtherParticipant(r, 'someone-else')).toBeNull();
  });
});
