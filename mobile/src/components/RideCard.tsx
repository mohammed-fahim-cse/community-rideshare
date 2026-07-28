import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { RidePost } from '../api/types';
import { PrimaryButton } from './PrimaryButton';

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

interface Props {
  ride: RidePost;
  onAccept: () => void;
  accepting?: boolean;
}

export function RideCard({ ride, onAccept, accepting }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.badge}>{ride.type === 'REQUEST' ? 'Request' : 'Offer'}</Text>
        <Text style={styles.scheduled}>
          {ride.mode === 'SCHEDULED' && ride.scheduledTime ? formatDateTime(ride.scheduledTime) : 'Now'}
        </Text>
      </View>

      <Text style={styles.route} numberOfLines={2}>
        {ride.pickupAddress} → {ride.destinationAddress}
      </Text>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>
          {ride.creator.name ?? 'Member'} · ★ {ride.creator.ratingAvg.toFixed(1)}
        </Text>
        {ride.suggestedFare != null ? <Text style={styles.fare}>${ride.suggestedFare.toFixed(2)}</Text> : null}
      </View>

      {ride.type === 'OFFER' && ride.seatsAvailable != null ? (
        <Text style={styles.seats}>
          {ride.seatsAvailable} seat{ride.seatsAvailable === 1 ? '' : 's'} available
        </Text>
      ) : null}

      <PrimaryButton title="Accept" onPress={onAccept} loading={accepting} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    textTransform: 'uppercase',
    overflow: 'hidden',
  },
  scheduled: { fontSize: 12, color: '#6b7280' },
  route: { fontSize: 15, fontWeight: '600', color: '#111827' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  meta: { fontSize: 13, color: '#6b7280' },
  fare: { fontSize: 13, fontWeight: '700', color: '#15803d' },
  seats: { fontSize: 12, color: '#6b7280' },
});
