import { useCallback, useState } from 'react';
import * as Location from 'expo-location';

interface CurrentLocation {
  lat: number;
  lng: number;
  address: string | null;
}

export function useCurrentLocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = useCallback(async (): Promise<CurrentLocation | null> => {
    setError(null);
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied.');
        return null;
      }

      const position = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = position.coords;

      let address: string | null = null;
      try {
        // Not supported on web — falls through to the coordinate fallback below.
        const results = await Location.reverseGeocodeAsync({ latitude, longitude });
        const first = results[0];
        if (first) {
          address = [first.name, first.street, first.city].filter(Boolean).join(', ');
        }
      } catch {
        address = null;
      }

      return { lat: latitude, lng: longitude, address };
    } catch {
      setError('Could not get your location.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { getCurrentLocation, loading, error };
}
