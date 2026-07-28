import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { registerDevice, type DevicePlatform } from '../api/notifications';

export interface PushRegistrationResult {
  ok: boolean;
  reason?: string;
}

// Best-effort: requests permission, then tries to obtain a real Expo push token and
// register it with the backend. Getting a token can fail in dev environments without
// an EAS project configured (or isn't supported at all on web) -- that's reported back
// rather than sending a fabricated token, since a fake token would be useless anyway.
export async function registerForPushNotifications(accessToken: string): Promise<PushRegistrationResult> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    return { ok: false, reason: 'Notification permission was denied.' };
  }

  try {
    const pushToken = await Notifications.getExpoPushTokenAsync();
    await registerDevice(accessToken, pushToken.data, Platform.OS as DevicePlatform);
    return { ok: true };
  } catch {
    return { ok: false, reason: "Couldn't get a push token in this environment." };
  }
}
