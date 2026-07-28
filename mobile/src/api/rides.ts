import { apiRequest } from './client';
import type { CreateRidePostInput, RidePost, RidePostType } from './types';

export interface ListRidesParams {
  type?: RidePostType;
  near?: { lat: number; lng: number };
}

export function listRides(token: string, params: ListRidesParams = {}): Promise<RidePost[]> {
  const query = new URLSearchParams();
  if (params.type) query.set('type', params.type);
  if (params.near) query.set('near', `${params.near.lat},${params.near.lng}`);

  const qs = query.toString();
  return apiRequest<RidePost[]>(`/rides${qs ? `?${qs}` : ''}`, { token });
}

export function createRidePost(token: string, input: CreateRidePostInput): Promise<RidePost> {
  return apiRequest<RidePost>('/rides', { method: 'POST', body: input, token });
}

export function acceptRide(token: string, rideId: string): Promise<RidePost> {
  return apiRequest<RidePost>(`/rides/${rideId}/accept`, { method: 'POST', token });
}
