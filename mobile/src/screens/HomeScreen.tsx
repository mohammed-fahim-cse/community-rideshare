import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { PrimaryButton } from '../components/PrimaryButton';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>You're in.</Text>
        <Text style={styles.subtitle}>{user?.name ?? user?.phone}</Text>
        {user?.status === 'PENDING' ? (
          <Text style={styles.pending}>Your community admin hasn't approved your membership yet.</Text>
        ) : null}
        <Text style={styles.note}>The ride feed lands in the next build step.</Text>
      </View>

      <PrimaryButton title="Log out" variant="secondary" onPress={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingVertical: 48,
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 6 },
  subtitle: { fontSize: 16, color: '#374151', marginBottom: 4 },
  pending: { fontSize: 14, color: '#b45309', marginTop: 8 },
  note: { fontSize: 14, color: '#6b7280', marginTop: 16 },
});
