import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'rideshare.accessToken';

// AsyncStorage isn't encrypted at rest — fine for this MVP, but swap to
// expo-secure-store before shipping a real build (it has no web support,
// which is why it isn't used here yet while Expo web is the dev/test target).
export const tokenStorage = {
  get: () => AsyncStorage.getItem(TOKEN_KEY),
  set: (token: string) => AsyncStorage.setItem(TOKEN_KEY, token),
  clear: () => AsyncStorage.removeItem(TOKEN_KEY),
};
