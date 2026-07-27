import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/RootNavigator';
import { PrimaryButton } from '../components/PrimaryButton';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>Community RideShare</Text>
        <Text style={styles.subtitle}>Get around with people you already trust.</Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton title="Join with invite code" onPress={() => navigation.navigate('JoinCommunity')} />
        <PrimaryButton
          title="I already have an account"
          variant="secondary"
          onPress={() => navigation.navigate('Login')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'space-between',
    paddingVertical: 64,
  },
  title: { fontSize: 30, fontWeight: '800', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6b7280' },
  actions: { gap: 12 },
});
