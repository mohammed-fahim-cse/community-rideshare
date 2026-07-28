import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../auth/AuthContext';
import { useSocket } from '../realtime/SocketContext';
import { listRides } from '../api/rides';
import { ApiError } from '../api/client';
import type { RidePost, RidePostType } from '../api/types';
import { RideCard } from '../components/RideCard';
import { SegmentedControl } from '../components/SegmentedControl';

type Props = NativeStackScreenProps<AppStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { user, accessToken, logout } = useAuth();
  const socket = useSocket();
  const [type, setType] = useState<RidePostType>('REQUEST');
  const [rides, setRides] = useState<RidePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable onPress={logout} hitSlop={8}>
          <Text style={styles.headerLink}>Log out</Text>
        </Pressable>
      ),
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('CreateRidePost')} hitSlop={8}>
          <Text style={styles.headerLink}>+ New</Text>
        </Pressable>
      ),
    });
  }, [navigation, logout]);

  // Best-effort: the feed still works community-wide if location is denied or unavailable.
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const position = await Location.getCurrentPositionAsync({});
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
      } catch {
        // Ignore — fall back to the unfiltered community feed.
      }
    })();
  }, []);

  const fetchRides = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await listRides(accessToken, { type, near: coords ?? undefined });
      setRides(data);
    } catch (err) {
      Alert.alert('Could not load rides', err instanceof ApiError ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, type, coords]);

  useEffect(() => {
    setLoading(true);
    fetchRides();
  }, [fetchRides]);

  // Live feed updates: a post appears the moment someone else posts it, and disappears
  // the moment it's taken or cancelled, without waiting for a manual refresh.
  useEffect(() => {
    if (!socket) return;

    const onNew = (post: RidePost) => {
      if (post.type !== type) return;
      setRides((prev) => (prev.some((r) => r.id === post.id) ? prev : [post, ...prev]));
    };
    const onRemoved = ({ rideId }: { rideId: string }) => {
      setRides((prev) => prev.filter((r) => r.id !== rideId));
    };

    socket.on('ride:new', onNew);
    socket.on('ride:taken', onRemoved);
    socket.on('ride:cancelled', onRemoved);

    return () => {
      socket.off('ride:new', onNew);
      socket.off('ride:taken', onRemoved);
      socket.off('ride:cancelled', onRemoved);
    };
  }, [socket, type]);

  // ride:accepted is only ever sent to the creator's own room, so receiving it here
  // always means "someone accepted one of my own posts" — the only way a creator finds
  // out, since their own posts never show up in their own feed.
  useEffect(() => {
    if (!socket) return;
    const onAccepted = (ride: RidePost) => {
      Alert.alert('Your ride was accepted', `${ride.match?.acceptedBy.name ?? 'A member'} is on it.`, [
        { text: 'Later', style: 'cancel' },
        { text: 'View', onPress: () => navigation.navigate('ActiveRide', { ride }) },
      ]);
    };
    socket.on('ride:accepted', onAccepted);
    return () => {
      socket.off('ride:accepted', onAccepted);
    };
  }, [socket, navigation]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRides();
  };

  return (
    <View style={styles.container}>
      {user?.status === 'PENDING' ? (
        <Text style={styles.pending}>Your community admin hasn't approved your membership yet.</Text>
      ) : null}

      <View style={styles.toggleWrap}>
        <SegmentedControl
          options={[
            { label: 'Nearby Requests', value: 'REQUEST' },
            { label: 'Nearby Offers', value: 'OFFER' },
          ]}
          value={type}
          onChange={setType}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loading} size="large" />
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RideCard ride={item} onPress={() => navigation.navigate('RideDetail', { rideId: item.id })} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {type === 'REQUEST' ? 'No ride requests nearby right now.' : 'No ride offers nearby right now.'}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerLink: { color: '#2563eb', fontSize: 15, fontWeight: '600' },
  pending: { fontSize: 13, color: '#b45309', backgroundColor: '#fffbeb', padding: 10 },
  toggleWrap: { paddingHorizontal: 16, paddingTop: 12 },
  loading: { marginTop: 40 },
  listContent: { padding: 16, paddingTop: 4, flexGrow: 1 },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 40, fontSize: 14 },
});
