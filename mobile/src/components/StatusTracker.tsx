import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { RidePostStatus } from '../api/types';

const STEPS: { key: string; label: string }[] = [
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'IN_PROGRESS', label: 'Driver arrived' },
  { key: 'COMPLETED', label: 'Completed' },
];

const ORDER: Record<string, number> = { ACCEPTED: 0, IN_PROGRESS: 1, COMPLETED: 2 };

export function StatusTracker({ status }: { status: RidePostStatus }) {
  const currentIndex = ORDER[status] ?? 0;

  return (
    <View style={styles.row}>
      {STEPS.map((step, index) => {
        const done = index <= currentIndex;
        return (
          <React.Fragment key={step.key}>
            {index > 0 ? <View style={[styles.connector, done && styles.connectorDone]} /> : null}
            <View style={styles.step}>
              <View style={[styles.circle, done && styles.circleDone]}>
                <Text style={[styles.circleText, done && styles.circleTextDone]}>{index + 1}</Text>
              </View>
              <Text style={[styles.label, done && styles.labelDone]}>{step.label}</Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24 },
  step: { alignItems: 'center', width: 76 },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: { backgroundColor: '#2563eb' },
  circleText: { fontSize: 13, fontWeight: '700', color: '#9ca3af' },
  circleTextDone: { color: '#fff' },
  label: { fontSize: 11, color: '#9ca3af', marginTop: 6, textAlign: 'center' },
  labelDone: { color: '#111827', fontWeight: '600' },
  connector: { height: 2, backgroundColor: '#e5e7eb', flex: 1, marginTop: 13 },
  connectorDone: { backgroundColor: '#2563eb' },
});
