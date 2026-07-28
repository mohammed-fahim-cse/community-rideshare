import { apiRequest } from './client';
import type { CreateRidePostInput, RideHistoryItem, RidePost, RidePostType } from './types';

export interface ListRidesParams {
  type?: RidePostType;
  near?: { lat: number; lng: number };
  radiusKm?: number;
}

export function listRides(token: string, params: ListRidesParams = {}): Promise<RidePost[]> {
  const query = new URLSearchParams();
  if (params.type) query.set('type', params.type);
  if (params.near) query.set('near', `${params.near.lat},${params.near.lng}`);
  if (params.radiusKm) query.set('radiusKm', String(params.radiusKm));

  const qs = query.toString();
  return apiRequest<RidePost[]>(`/rides${qs ? `?${qs}` : ''}`, { token });
}

export function getRide(token: string, rideId: string): Promise<RidePost> {
  return apiRequest<RidePost>(`/rides/${rideId}`, { token });
}

export function listMyRides(token: string): Promise<RideHistoryItem[]> {
  return apiRequest<RideHistoryItem[]>('/rides/mine', { token });
}

export function createRidePost(token: string, input: CreateRidePostInput): Promise<RidePost> {
  return apiRequest<RidePost>('/rides', { method: 'POST', body: input, token });
}

export function acceptRide(token: string, rideId: string): Promise<RidePost> {
  return apiRequest<RidePost>(`/rides/${rideId}/accept`, { method: 'POST', token });
}

export function markArrived(token: string, rideId: string): Promise<RidePost> {
  return apiRequest<RidePost>(`/rides/${rideId}/arrived`, { method: 'POST', token });
}

export function markCompleted(token: string, rideId: string): Promise<RidePost> {
  return apiRequest<RidePost>(`/rides/${rideId}/complete`, { method: 'POST', token });
}

export function cancelRide(token: string, rideId: string, reason?: string): Promise<RidePost> {
  return apiRequest<RidePost>(`/rides/${rideId}/cancel`, { method: 'POST', body: { reason }, token });
}
