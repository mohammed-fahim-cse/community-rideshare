import { apiRequest } from './client';
import type { ChatMessage } from './types';

export function listMessages(token: string, rideId: string): Promise<ChatMessage[]> {
  return apiRequest<ChatMessage[]>(`/rides/${rideId}/messages`, { token });
}

export function sendMessage(token: string, rideId: string, text: string): Promise<ChatMessage> {
  return apiRequest<ChatMessage>(`/rides/${rideId}/messages`, { method: 'POST', body: { text }, token });
}
