import AsyncStorage from '@react-native-async-storage/async-storage';

const RADIUS_KEY = 'rideshare.radiusKm';
const NOTIFICATIONS_KEY = 'rideshare.notificationsEnabled';

export const preferences = {
  // null means "use the community default" (the backend already supports this override).
  getRadiusKm: async (): Promise<number | null> => {
    const raw = await AsyncStorage.getItem(RADIUS_KEY);
    return raw ? Number(raw) : null;
  },
  setRadiusKm: (km: number | null) =>
    km === null ? AsyncStorage.removeItem(RADIUS_KEY) : AsyncStorage.setItem(RADIUS_KEY, String(km)),

  getNotificationsEnabled: async (): Promise<boolean> => {
    return (await AsyncStorage.getItem(NOTIFICATIONS_KEY)) === 'true';
  },
  setNotificationsEnabled: (enabled: boolean) => AsyncStorage.setItem(NOTIFICATIONS_KEY, String(enabled)),
};
