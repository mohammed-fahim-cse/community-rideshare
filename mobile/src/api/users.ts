import { apiRequest } from './client';
import type { Me, PublicUser } from './types';

export interface UpdateMeInput {
  name?: string;
  photoUrl?: string;
  phoneVisible?: boolean;
}

export function updateMe(token: string, input: UpdateMeInput): Promise<Me> {
  return apiRequest<Me>('/users/me', { method: 'PATCH', body: input, token });
}

export function getPublicProfile(token: string, userId: string): Promise<PublicUser> {
  return apiRequest<PublicUser>(`/users/${userId}`, { token });
}
