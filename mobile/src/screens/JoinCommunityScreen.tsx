import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';
import { TextField } from '../components/TextField';
import { PrimaryButton } from '../components/PrimaryButton';
import { ErrorBanner } from '../components/ErrorBanner';

type Props = NativeStackScreenProps<AuthStackParamList, 'JoinCommunity'>;

export default function JoinCommunityScreen({ navigation }: Props) {
  const { signup } = useAuth();
  const [phone, setPhone] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = phone.trim().length > 0 && inviteCode.trim().length > 0 && !loading;

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const trimmedPhone = phone.trim();
      await signup(trimmedPhone, inviteCode.trim().toUpperCase());
      navigation.navigate('VerifyOtp', { phone: trimmedPhone });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>Join your community</Text>
      <Text style={styles.subtitle}>Ask your community admin for the invite code.</Text>

      <ErrorBanner message={error} />

      <TextField
        label="Phone number"
        placeholder="+15555550100"
        keyboardType="phone-pad"
        autoComplete="tel"
        value={phone}
        onChangeText={setPhone}
      />
      <TextField
        label="Invite code"
        placeholder="DEMO1234"
        autoCapitalize="characters"
        value={inviteCode}
        onChangeText={setInviteCode}
      />

      <PrimaryButton title="Send verification code" onPress={handleSubmit} loading={loading} disabled={!canSubmit} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 24 },
});
