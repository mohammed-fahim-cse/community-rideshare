import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export function PrimaryButton({ title, onPress, loading, disabled, variant = 'primary' }: Props) {
  const isSecondary = variant === 'secondary';
  return (
    <Pressable
      style={[
        styles.button,
        isSecondary ? styles.secondary : styles.primary,
        (disabled || loading) && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary ? '#2563eb' : '#fff'} />
      ) : (
        <Text style={isSecondary ? styles.secondaryText : styles.primaryText}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primary: { backgroundColor: '#2563eb' },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#2563eb' },
  disabled: { opacity: 0.5 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryText: { color: '#2563eb', fontSize: 16, fontWeight: '600' },
});
