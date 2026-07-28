import type { PublicUser, RidePost } from '../api/types';

// Mirrors backend RidesService: for a REQUEST the creator is the rider and whoever
// accepts is the driver; for an OFFER it's reversed (the creator posted seats).
export function getDriver(ride: RidePost): PublicUser | null {
  if (!ride.match) return null;
  return ride.type === 'REQUEST' ? ride.match.acceptedBy : ride.creator;
}

export function getRider(ride: RidePost): PublicUser | null {
  if (!ride.match) return null;
  return ride.type === 'REQUEST' ? ride.creator : ride.match.acceptedBy;
}

export function isDriver(ride: RidePost, userId: string): boolean {
  return getDriver(ride)?.id === userId;
}

export function getOtherParticipant(ride: RidePost, userId: string): PublicUser | null {
  if (!ride.match) return null;
  if (ride.creator.id === userId) return ride.match.acceptedBy;
  if (ride.match.acceptedBy.id === userId) return ride.creator;
  return null;
}
