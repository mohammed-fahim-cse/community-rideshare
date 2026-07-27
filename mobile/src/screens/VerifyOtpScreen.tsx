import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';
import { TextField } from '../components/TextField';
import { PrimaryButton } from '../components/PrimaryButton';
import { ErrorBanner } from '../components/ErrorBanner';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyOtp'>;

export default function VerifyOtpScreen({ route }: Props) {
  const { phone } = route.params;
  const { verifyOtp, login } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await verifyOtp(phone, code.trim());
      // No manual navigation: RootNavigator swaps to the app stack once status is signedIn.
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResent(false);
    try {
      // The user already exists after signup, so re-requesting a login code works
      // whether this screen was reached from signup or login.
      await login(phone);
      setResent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resend the code.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>Enter the code</Text>
      <Text style={styles.subtitle}>We sent a 6-digit code to {phone}.</Text>

      <ErrorBanner message={error} />
      {resent && !error ? <Text style={styles.resent}>New code sent.</Text> : null}

      <TextField
        label="Verification code"
        placeholder="123456"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
      />

      <PrimaryButton
        title="Verify"
        onPress={handleSubmit}
        loading={loading}
        disabled={code.trim().length !== 6 || loading}
      />

      <Pressable onPress={handleResend} style={styles.resendLink}>
        <Text style={styles.resendText}>Resend code</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 24 },
  resent: { color: '#15803d', fontSize: 13, marginBottom: 12 },
  resendLink: { marginTop: 16, alignItems: 'center' },
  resendText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
});
