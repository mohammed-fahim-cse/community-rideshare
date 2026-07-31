import { apiRequest } from './client';
import type { Me, VerifyOtpResponse } from './types';

export function login(phone: string): Promise<{ message: string }> {
  return apiRequest('/auth/login', { method: 'POST', body: { phone } });
}

export function verifyOtp(phone: string, code: string): Promise<VerifyOtpResponse> {
  return apiRequest('/auth/verify-otp', { method: 'POST', body: { phone, code } });
}

export function getMe(token: string): Promise<Me> {
  return apiRequest('/users/me', { token });
}
