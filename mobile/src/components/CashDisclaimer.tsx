import React from 'react';
import { StyleSheet, Text } from 'react-native';

export function CashDisclaimer() {
  return (
    <Text style={styles.text}>
      Payment is handled directly in cash between members. Community RideShare does not process, hold, or guarantee
      any payment.
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 12, color: '#6b7280', lineHeight: 18 },
});
