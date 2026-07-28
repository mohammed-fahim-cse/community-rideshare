import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../auth/AuthContext';
import { listBlocks, unblockUser } from '../api/blocks';
import { ApiError } from '../api/client';
import type { PublicUser } from '../api/types';
import { preferences } from '../settings/preferences';
import { registerForPushNotifications } from '../settings/pushNotifications';

type Props = NativeStackScreenProps<AppStackParamList, 'Settings'>;

const RADIUS_OPTIONS = [2, 5, 10, 20, 50];

export default function SettingsScreen(_props: Props) {
  const { accessToken } = useAuth();
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notifBusy, setNotifBusy] = useState(false);
  const [blocked, setBlocked] = useState<PublicUser[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(true);

  useEffect(() => {
    preferences.getRadiusKm().then(setRadiusKm);
    preferences.getNotificationsEnabled().then(setNotificationsEnabled);
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    listBlocks(accessToken)
      .then(setBlocked)
      .catch(() => {})
      .finally(() => setLoadingBlocks(false));
  }, [accessToken]);

  const handleSelectRadius = (km: number | null) => {
    setRadiusKm(km);
    preferences.setRadiusKm(km);
  };

  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    await preferences.setNotificationsEnabled(value);
    if (!value || !accessToken) return;

    setNotifBusy(true);
    const result = await registerForPushNotifications(accessToken);
    setNotifBusy(false);
    if (!result.ok) {
      Alert.alert('Notifications not enabled', result.reason ?? 'Please try again.');
      setNotificationsEnabled(false);
      await preferences.setNotificationsEnabled(false);
    }
  };

  const handleUnblock = async (user: PublicUser) => {
    if (!accessToken) return;
    try {
      await unblockUser(accessToken, user.id);
      setBlocked((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      Alert.alert('Could not unblock', err instanceof ApiError ? err.message : 'Please try again.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Search radius</Text>
      <Text style={styles.sectionSubtitle}>
        How far to look for nearby rides. Defaults to your community's setting.
      </Text>
      <View style={styles.chipRow}>
        <Pressable
          style={[styles.chip, radiusKm === null && styles.chipActive]}
          onPress={() => handleSelectRadius(null)}
        >
          <Text style={[styles.chipText, radiusKm === null && styles.chipTextActive]}>Default</Text>
        </Pressable>
        {RADIUS_OPTIONS.map((km) => (
          <Pressable
            key={km}
            style={[styles.chip, radiusKm === km && styles.chipActive]}
            onPress={() => handleSelectRadius(km)}
          >
            <Text style={[styles.chipText, radiusKm === km && styles.chipTextActive]}>{km} km</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.divider} />

      <View style={styles.toggleRow}>
        <View style={styles.toggleLabel}>
          <Text style={styles.sectionTitle}>Push notifications</Text>
          <Text style={styles.sectionSubtitle}>Get notified when a ride is accepted or a message arrives.</Text>
        </View>
        {notifBusy ? <ActivityIndicator /> : <Switch value={notificationsEnabled} onValueChange={handleToggleNotifications} />}
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Blocked members</Text>
      {loadingBlocks ? (
        <ActivityIndicator style={styles.blockedLoading} />
      ) : blocked.length === 0 ? (
        <Text style={styles.sectionSubtitle}>You haven't blocked anyone.</Text>
      ) : (
        blocked.map((user) => (
          <View key={user.id} style={styles.blockedRow}>
            <Text style={styles.blockedName}>{user.name ?? 'Member'}</Text>
            <Pressable onPress={() => handleUnblock(user)}>
              <Text style={styles.unblockText}>Unblock</Text>
            </Pressable>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fff', flexGrow: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  sectionSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 4, marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 24 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  toggleLabel: { flex: 1 },
  blockedLoading: { marginTop: 8 },
  blockedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  blockedName: { fontSize: 14, color: '#111827', fontWeight: '600' },
  unblockText: { fontSize: 13, color: '#2563eb', fontWeight: '600' },
});
