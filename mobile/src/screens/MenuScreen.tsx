import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../auth/AuthContext';

type Props = NativeStackScreenProps<AppStackParamList, 'Menu'>;

export default function MenuScreen({ navigation }: Props) {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.you}>{user?.name ?? user?.phone}</Text>
      </View>

      <Row label="Profile" onPress={() => navigation.navigate('Profile')} />
      <Row label="Ride history" onPress={() => navigation.navigate('RideHistory')} />
      <Row label="Settings" onPress={() => navigation.navigate('Settings')} />
      <Row label="Log out" onPress={logout} destructive />
    </View>
  );
}

function Row({ label, onPress, destructive }: { label: string; onPress: () => void; destructive?: boolean }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={[styles.rowText, destructive && styles.rowTextDestructive]}>{label}</Text>
      {!destructive ? <Text style={styles.chevron}>›</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 8 },
  section: { paddingHorizontal: 20, paddingVertical: 16 },
  you: { fontSize: 13, color: '#6b7280' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  rowText: { fontSize: 16, color: '#111827', fontWeight: '500' },
  rowTextDestructive: { color: '#b91c1c' },
  chevron: { fontSize: 18, color: '#d1d5db' },
});
