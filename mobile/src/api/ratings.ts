import { apiRequest } from './client';
import type { Rating } from './types';

export function rateRide(token: string, rideId: string, stars: number, comment?: string): Promise<Rating> {
  return apiRequest<Rating>(`/rides/${rideId}/rate`, { method: 'POST', body: { stars, comment }, token });
}
