import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../auth/AuthContext';
import { useSocket } from '../realtime/SocketContext';
import { acceptRide, getRide } from '../api/rides';
import { ApiError } from '../api/client';
import type { RidePost } from '../api/types';
import { PrimaryButton } from '../components/PrimaryButton';
import { CashDisclaimer } from '../components/CashDisclaimer';

type Props = NativeStackScreenProps<AppStackParamList, 'RideDetail'>;

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function RideDetailScreen({ route, navigation }: Props) {
  const { rideId } = route.params;
  const { accessToken } = useAuth();
  const socket = useSocket();
  const [ride, setRide] = useState<RidePost | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [takenElsewhere, setTakenElsewhere] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    getRide(accessToken, rideId)
      .then(setRide)
      .catch(() => setRide(null))
      .finally(() => setLoading(false));
  }, [accessToken, rideId]);

  // If someone else takes or the creator cancels it while this screen is open.
  useEffect(() => {
    if (!socket) return;
    const onRemoved = ({ rideId: id }: { rideId: string }) => {
      if (id === rideId) {
        setTakenElsewhere(true);
      }
    };
    socket.on('ride:taken', onRemoved);
    socket.on('ride:cancelled', onRemoved);
    return () => {
      socket.off('ride:taken', onRemoved);
      socket.off('ride:cancelled', onRemoved);
    };
  }, [socket, rideId]);

  const handleAccept = async () => {
    if (!accessToken) return;
    setAccepting(true);
    try {
      const updated = await acceptRide(accessToken, rideId);
      navigation.replace('ActiveRide', { ride: updated });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Please try again.';
      Alert.alert('Could not accept this ride', message);
      if (err instanceof ApiError && err.status === 409) {
        navigation.goBack();
      }
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>This ride post is no longer available.</Text>
      </View>
    );
  }

  const isStillOpen = ride.status === 'OPEN' && !takenElsewhere;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.badge}>{ride.type === 'REQUEST' ? 'Ride request' : 'Ride offer'}</Text>
      <Text style={styles.when}>
        {ride.mode === 'SCHEDULED' && ride.scheduledTime ? formatDateTime(ride.scheduledTime) : 'Leaving now'}
      </Text>

      <View style={styles.routeBlock}>
        <View style={styles.routeRow}>
          <View style={[styles.dot, styles.dotPickup]} />
          <Text style={styles.routeText}>{ride.pickupAddress}</Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeRow}>
          <View style={[styles.dot, styles.dotDestination]} />
          <Text style={styles.routeText}>{ride.destinationAddress}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>{ride.type === 'REQUEST' ? 'Requested by' : 'Offered by'}</Text>
        <Text style={styles.person}>
          {ride.creator.name ?? 'Member'} · ★ {ride.creator.ratingAvg.toFixed(1)} ({ride.creator.ratingCount})
        </Text>
      </View>

      {ride.type === 'OFFER' && ride.seatsAvailable != null ? (
        <Text style={styles.detail}>
          {ride.seatsAvailable} seat{ride.seatsAvailable === 1 ? '' : 's'} available
        </Text>
      ) : null}

      {ride.suggestedFare != null ? (
        <Text style={styles.detail}>Suggested fare: ${ride.suggestedFare.toFixed(2)}</Text>
      ) : null}

      {!isStillOpen ? <Text style={styles.taken}>This ride was just taken.</Text> : null}

      <View style={styles.disclaimerWrap}>
        <CashDisclaimer />
      </View>

      {isStillOpen ? (
        <PrimaryButton
          title={ride.type === 'REQUEST' ? 'Accept and drive' : 'Accept ride'}
          onPress={handleAccept}
          loading={accepting}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  notFound: { color: '#6b7280', fontSize: 14 },
  container: { padding: 24, backgroundColor: '#fff', flexGrow: 1 },
  badge: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    textTransform: 'uppercase',
  },
  when: { fontSize: 13, color: '#6b7280', marginTop: 6, marginBottom: 20 },
  routeBlock: { marginBottom: 20 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotPickup: { backgroundColor: '#2563eb' },
  dotDestination: { backgroundColor: '#111827' },
  routeLine: { width: 1, height: 20, backgroundColor: '#d1d5db', marginLeft: 4.5, marginVertical: 2 },
  routeText: { fontSize: 16, fontWeight: '600', color: '#111827', flexShrink: 1 },
  card: { backgroundColor: '#f9fafb', borderRadius: 10, padding: 14, marginBottom: 16 },
  cardLabel: { fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  person: { fontSize: 15, fontWeight: '600', color: '#111827' },
  detail: { fontSize: 14, color: '#374151', marginBottom: 6 },
  taken: { fontSize: 14, color: '#b91c1c', fontWeight: '600', marginTop: 8 },
  disclaimerWrap: { marginVertical: 20 },
});
