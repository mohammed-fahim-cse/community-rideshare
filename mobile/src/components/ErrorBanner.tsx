import React from 'react';
import { StyleSheet, Text } from 'react-native';

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }
  return <Text style={styles.text}>{message}</Text>;
}

const styles = StyleSheet.create({
  text: { color: '#b91c1c', fontSize: 14, marginBottom: 12 },
});
