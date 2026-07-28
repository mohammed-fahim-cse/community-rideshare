import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../auth/AuthContext';
import { listMyRides } from '../api/rides';
import { ApiError } from '../api/client';
import type { RideHistoryItem } from '../api/types';
import { getOtherParticipant, isDriver } from '../rides/roles';

type Props = NativeStackScreenProps<AppStackParamList, 'RideHistory'>;

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Open',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function HistoryRow({ item, myId, onPress }: { item: RideHistoryItem; myId: string; onPress: () => void }) {
  const other = getOtherParticipant(item, myId);
  const role = item.match ? (isDriver(item, myId) ? 'Drove' : 'Rode') : item.creator.id === myId ? 'Posted' : '';

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowTop}>
        <Text style={styles.role}>{role}</Text>
        <Text style={[styles.status, item.status === 'CANCELLED' && styles.statusCancelled]}>
          {STATUS_LABEL[item.status]}
        </Text>
      </View>
      <Text style={styles.route} numberOfLines={1}>
        {item.pickupAddress} → {item.destinationAddress}
      </Text>
      <View style={styles.rowBottom}>
        <Text style={styles.meta}>
          {formatDate(item.createdAt)}
          {other ? ` · with ${other.name ?? 'Member'}` : ''}
        </Text>
        {item.status === 'COMPLETED' ? (
          <Text style={styles.rating}>
            {item.myRating ? `You gave ★${item.myRating}` : 'Not rated yet'}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function RideHistoryScreen({ navigation }: Props) {
  const { user, accessToken } = useAuth();
  const [rides, setRides] = useState<RideHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await listMyRides(accessToken);
      setRides(data);
    } catch (err) {
      Alert.alert('Could not load history', err instanceof ApiError ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  // Refetch every time this screen gains focus (not just on first mount) — native-stack
  // keeps screens mounted, so returning via back navigation wouldn't otherwise refresh a
  // ride's status/rating after it changed while this screen was in the background.
  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory]),
  );

  if (!user) return null;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={rides}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchHistory();
          }}
        />
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={<Text style={styles.empty}>No rides yet — your history will show up here.</Text>}
      renderItem={({ item }) => (
        <HistoryRow
          item={item}
          myId={user.id}
          onPress={() => {
            if (item.match) {
              navigation.navigate('ActiveRide', { ride: item });
            }
          }}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  list: { flexGrow: 1, backgroundColor: '#fff' },
  separator: { height: 1, backgroundColor: '#f3f4f6' },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 40, fontSize: 14 },
  row: { paddingHorizontal: 20, paddingVertical: 14 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  role: { fontSize: 12, fontWeight: '700', color: '#2563eb', textTransform: 'uppercase' },
  status: { fontSize: 12, color: '#15803d', fontWeight: '600' },
  statusCancelled: { color: '#b91c1c' },
  route: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 4 },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  meta: { fontSize: 12, color: '#6b7280' },
  rating: { fontSize: 12, color: '#92400e', fontWeight: '600' },
});
