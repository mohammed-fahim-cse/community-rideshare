import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../auth/AuthContext';
import { updateMe } from '../api/users';
import { ApiError } from '../api/client';
import { TextField } from '../components/TextField';
import { PrimaryButton } from '../components/PrimaryButton';
import { ErrorBanner } from '../components/ErrorBanner';

type Props = NativeStackScreenProps<AppStackParamList, 'Profile'>;

function formatMemberSince(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export default function ProfileScreen(_props: Props) {
  const { user, setUser, accessToken } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl ?? '');
  const [phoneVisible, setPhoneVisible] = useState(user?.phoneVisible ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleSave = async () => {
    if (!accessToken) return;
    setError(null);
    setSaving(true);
    try {
      const updated = await updateMe(accessToken, {
        name: name.trim() || undefined,
        photoUrl: photoUrl.trim() || undefined,
        phoneVisible,
      });
      setUser(updated);
      Alert.alert('Saved', 'Your profile was updated.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <ErrorBanner message={error} />

        <View style={styles.summary}>
          <Text style={styles.rating}>★ {user.ratingAvg.toFixed(1)}</Text>
          <Text style={styles.ratingCount}>
            {user.ratingCount} rating{user.ratingCount === 1 ? '' : 's'} · member since{' '}
            {formatMemberSince(user.createdAt)}
          </Text>
        </View>

        <TextField label="Name" placeholder="Your name" value={name} onChangeText={setName} />
        <TextField
          label="Photo URL"
          placeholder="https://…"
          autoCapitalize="none"
          value={photoUrl}
          onChangeText={setPhotoUrl}
        />
        <TextField label="Phone" value={user.phone} editable={false} style={styles.readOnly} />

        <View style={styles.toggleRow}>
          <View style={styles.toggleLabel}>
            <Text style={styles.toggleTitle}>Show phone number publicly</Text>
            <Text style={styles.toggleSubtitle}>
              Otherwise it's only shared once a ride with you is accepted.
            </Text>
          </View>
          <Switch value={phoneVisible} onValueChange={setPhoneVisible} />
        </View>

        <PrimaryButton title="Save changes" onPress={handleSave} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 24, paddingBottom: 48 },
  summary: { alignItems: 'center', marginBottom: 24 },
  rating: { fontSize: 28, fontWeight: '800', color: '#f59e0b' },
  ratingCount: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  readOnly: { backgroundColor: '#f3f4f6', color: '#6b7280' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16,
    gap: 12,
  },
  toggleLabel: { flex: 1 },
  toggleTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  toggleSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
});
