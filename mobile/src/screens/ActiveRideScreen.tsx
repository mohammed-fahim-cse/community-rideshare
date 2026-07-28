import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../auth/AuthContext';
import { useSocket } from '../realtime/SocketContext';
import { cancelRide, markArrived, markCompleted } from '../api/rides';
import { ApiError } from '../api/client';
import type { RidePost } from '../api/types';
import { getDriver, getOtherParticipant } from '../rides/roles';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextField } from '../components/TextField';
import { StatusTracker } from '../components/StatusTracker';

type Props = NativeStackScreenProps<AppStackParamList, 'ActiveRide'>;

export default function ActiveRideScreen({ route, navigation }: Props) {
  const { user, accessToken } = useAuth();
  const socket = useSocket();
  const [ride, setRide] = useState<RidePost>(route.params.ride);
  const [busy, setBusy] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const rideId = ride.id;
  const myId = user?.id;
  const driver = getDriver(ride);
  const iAmDriver = driver?.id === myId;
  const other = myId ? getOtherParticipant(ride, myId) : null;

  useEffect(() => {
    navigation.setOptions({ title: iAmDriver ? 'Your passenger' : 'Your ride' });
  }, [navigation, iAmDriver]);

  // Live updates when the OTHER participant acts (we already have our own action's
  // result from the REST response, so this only fires for the other party's moves).
  useEffect(() => {
    if (!socket) return;
    const onUpdate = (updated: RidePost) => {
      if (updated?.id === rideId) setRide(updated);
    };
    socket.on('ride:arrived', onUpdate);
    socket.on('ride:completed', onUpdate);
    socket.on('ride:cancelled', onUpdate);
    return () => {
      socket.off('ride:arrived', onUpdate);
      socket.off('ride:completed', onUpdate);
      socket.off('ride:cancelled', onUpdate);
    };
  }, [socket, rideId]);

  const runAction = async (action: () => Promise<RidePost>) => {
    if (!accessToken) return;
    setBusy(true);
    try {
      const updated = await action();
      setRide(updated);
      return updated;
    } catch (err) {
      Alert.alert('Could not update', err instanceof ApiError ? err.message : 'Please try again.');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const handleArrived = () => runAction(() => markArrived(accessToken!, rideId));
  const handleComplete = () => runAction(() => markCompleted(accessToken!, rideId));

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('A reason is required', "Let the other person know why you're cancelling.");
      return;
    }
    const updated = await runAction(() => cancelRide(accessToken!, rideId, cancelReason.trim()));
    if (updated) setShowCancelForm(false);
  };

  const handleCall = () => {
    if (!other?.phone) return;
    Linking.openURL(`tel:${other.phone}`).catch(() => {
      Alert.alert('Could not open the phone dialer');
    });
  };

  const isTerminal = ride.status === 'COMPLETED' || ride.status === 'CANCELLED';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {ride.status === 'CANCELLED' ? (
        <View style={styles.cancelledBanner}>
          <Text style={styles.cancelledTitle}>Ride cancelled</Text>
          {ride.match?.cancelReason ? <Text style={styles.cancelledReason}>"{ride.match.cancelReason}"</Text> : null}
        </View>
      ) : (
        <StatusTracker status={ride.status} />
      )}

      <View style={styles.routeBlock}>
        <Text style={styles.routeText}>{ride.pickupAddress}</Text>
        <Text style={styles.routeArrow}>↓</Text>
        <Text style={styles.routeText}>{ride.destinationAddress}</Text>
      </View>

      {other ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{iAmDriver ? 'Rider' : 'Driver'}</Text>
          <Text style={styles.person}>
            {other.name ?? 'Member'} · ★ {other.ratingAvg.toFixed(1)}
          </Text>
          {other.phone ? (
            <Text style={styles.phone} onPress={handleCall}>
              📞 {other.phone}
            </Text>
          ) : null}
        </View>
      ) : null}

      {!isTerminal ? (
        <View style={styles.actions}>
          <PrimaryButton
            title="Chat"
            variant="secondary"
            onPress={() => Alert.alert('Chat', 'Chat is coming in the next update.')}
          />

          {iAmDriver && ride.status === 'ACCEPTED' ? (
            <PrimaryButton title="Mark arrived at pickup" onPress={handleArrived} loading={busy} />
          ) : null}

          {ride.status === 'IN_PROGRESS' ? (
            <PrimaryButton title="Mark ride completed" onPress={handleComplete} loading={busy} />
          ) : null}

          {showCancelForm ? (
            <View style={styles.cancelForm}>
              <TextField
                label="Reason for cancelling"
                placeholder="e.g. Something came up"
                value={cancelReason}
                onChangeText={setCancelReason}
              />
              <View style={styles.cancelFormActions}>
                <View style={styles.cancelFormButton}>
                  <PrimaryButton title="Discard" variant="secondary" onPress={() => setShowCancelForm(false)} />
                </View>
                <View style={styles.cancelFormButton}>
                  <PrimaryButton title="Confirm cancel" onPress={handleCancel} loading={busy} />
                </View>
              </View>
            </View>
          ) : (
            <PrimaryButton title="Cancel ride" variant="secondary" onPress={() => setShowCancelForm(true)} />
          )}
        </View>
      ) : (
        <PrimaryButton title="Back to feed" onPress={() => navigation.popToTop()} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fff', flexGrow: 1 },
  cancelledBanner: { backgroundColor: '#fef2f2', borderRadius: 10, padding: 16, marginBottom: 20 },
  cancelledTitle: { fontSize: 16, fontWeight: '700', color: '#b91c1c' },
  cancelledReason: { fontSize: 14, color: '#7f1d1d', marginTop: 6, fontStyle: 'italic' },
  routeBlock: { marginBottom: 20 },
  routeText: { fontSize: 16, fontWeight: '600', color: '#111827' },
  routeArrow: { fontSize: 14, color: '#9ca3af', marginVertical: 2 },
  card: { backgroundColor: '#f9fafb', borderRadius: 10, padding: 14, marginBottom: 20 },
  cardLabel: { fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  person: { fontSize: 15, fontWeight: '600', color: '#111827' },
  phone: { fontSize: 14, color: '#2563eb', marginTop: 6, fontWeight: '600' },
  actions: { gap: 12 },
  cancelForm: { gap: 12, backgroundColor: '#fef2f2', padding: 14, borderRadius: 10 },
  cancelFormActions: { flexDirection: 'row', gap: 12 },
  cancelFormButton: { flex: 1 },
});
