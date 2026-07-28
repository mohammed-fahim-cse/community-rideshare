import { apiRequest } from './client';

export type DevicePlatform = 'ios' | 'android' | 'web';

export function registerDevice(
  token: string,
  deviceToken: string,
  platform: DevicePlatform,
): Promise<{ message: string }> {
  return apiRequest('/notifications/register-device', {
    method: 'POST',
    body: { token: deviceToken, platform },
    token,
  });
}
