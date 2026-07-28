import { apiRequest } from './client';
import type { PublicUser } from './types';

export function listBlocks(token: string): Promise<PublicUser[]> {
  return apiRequest<PublicUser[]>('/blocks', { token });
}

export function blockUser(token: string, blockedUserId: string): Promise<{ message: string }> {
  return apiRequest('/blocks', { method: 'POST', body: { blockedUserId }, token });
}

export function unblockUser(token: string, userId: string): Promise<{ message: string }> {
  return apiRequest(`/blocks/${userId}`, { method: 'DELETE', token });
}
