import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../auth/AuthContext';
import { createRidePost } from '../api/rides';
import { ApiError } from '../api/client';
import type { RideMode, RidePostType } from '../api/types';
import { useCurrentLocation } from '../location/useCurrentLocation';
import { TextField } from '../components/TextField';
import { PrimaryButton } from '../components/PrimaryButton';
import { ErrorBanner } from '../components/ErrorBanner';
import { SegmentedControl } from '../components/SegmentedControl';

type Props = NativeStackScreenProps<AppStackParamList, 'CreateRidePost'>;

export default function CreateRidePostScreen({ navigation }: Props) {
  const { accessToken } = useAuth();
  const { getCurrentLocation, loading: locating } = useCurrentLocation();

  const [type, setType] = useState<RidePostType>('REQUEST');
  const [mode, setMode] = useState<RideMode>('ON_DEMAND');
  const [scheduledTime, setScheduledTime] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupLat, setPickupLat] = useState('');
  const [pickupLng, setPickupLng] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [destinationLat, setDestinationLat] = useState('');
  const [destinationLng, setDestinationLng] = useState('');
  const [seatsAvailable, setSeatsAvailable] = useState('');
  const [suggestedFare, setSuggestedFare] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUseCurrentLocation = async () => {
    const location = await getCurrentLocation();
    if (!location) {
      Alert.alert('Could not get your location', 'You can still enter the pickup point manually below.');
      return;
    }
    setPickupLat(String(location.lat));
    setPickupLng(String(location.lng));
    setPickupAddress(location.address ?? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`);
  };

  const canSubmit =
    pickupAddress.trim().length > 0 &&
    pickupLat.trim().length > 0 &&
    pickupLng.trim().length > 0 &&
    destinationAddress.trim().length > 0 &&
    destinationLat.trim().length > 0 &&
    destinationLng.trim().length > 0 &&
    (mode === 'ON_DEMAND' || scheduledTime.trim().length > 0) &&
    (type === 'REQUEST' || seatsAvailable.trim().length > 0) &&
    !submitting;

  const handleSubmit = async () => {
    if (!accessToken) return;
    setError(null);

    let scheduledTimeIso: string | undefined;
    if (mode === 'SCHEDULED') {
      const parsed = new Date(scheduledTime);
      if (Number.isNaN(parsed.getTime())) {
        setError('Enter a valid scheduled time, e.g. 2026-08-01T14:30');
        return;
      }
      scheduledTimeIso = parsed.toISOString();
    }

    setSubmitting(true);
    try {
      await createRidePost(accessToken, {
        type,
        mode,
        pickupLat: Number(pickupLat),
        pickupLng: Number(pickupLng),
        pickupAddress: pickupAddress.trim(),
        destinationLat: Number(destinationLat),
        destinationLng: Number(destinationLng),
        destinationAddress: destinationAddress.trim(),
        scheduledTime: scheduledTimeIso,
        seatsAvailable: type === 'OFFER' ? Number(seatsAvailable) : undefined,
        suggestedFare: suggestedFare.trim() ? Number(suggestedFare) : undefined,
      });
      Alert.alert('Posted', 'Your ride post is live.');
      navigation.goBack();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <ErrorBanner message={error} />

        <SegmentedControl
          options={[
            { label: 'Request a ride', value: 'REQUEST' },
            { label: 'Offer to drive', value: 'OFFER' },
          ]}
          value={type}
          onChange={setType}
        />
        <SegmentedControl
          options={[
            { label: 'Now', value: 'ON_DEMAND' },
            { label: 'Scheduled', value: 'SCHEDULED' },
          ]}
          value={mode}
          onChange={setMode}
        />

        {mode === 'SCHEDULED' ? (
          <TextField
            label="Scheduled time"
            placeholder="2026-08-01T14:30"
            value={scheduledTime}
            onChangeText={setScheduledTime}
          />
        ) : null}

        <Text style={styles.sectionTitle}>Pickup</Text>
        <PrimaryButton
          title={locating ? 'Locating…' : '📍 Use current location'}
          variant="secondary"
          onPress={handleUseCurrentLocation}
          loading={locating}
        />
        <TextField
          label="Pickup address"
          placeholder="123 Main St"
          value={pickupAddress}
          onChangeText={setPickupAddress}
        />
        <TextField
          label="Pickup latitude"
          placeholder="37.7749"
          keyboardType="numeric"
          value={pickupLat}
          onChangeText={setPickupLat}
        />
        <TextField
          label="Pickup longitude"
          placeholder="-122.4194"
          keyboardType="numeric"
          value={pickupLng}
          onChangeText={setPickupLng}
        />

        <Text style={styles.sectionTitle}>Destination</Text>
        <TextField
          label="Destination address"
          placeholder="456 Oak Ave"
          value={destinationAddress}
          onChangeText={setDestinationAddress}
        />
        <TextField
          label="Destination latitude"
          placeholder="37.8044"
          keyboardType="numeric"
          value={destinationLat}
          onChangeText={setDestinationLat}
        />
        <TextField
          label="Destination longitude"
          placeholder="-122.2712"
          keyboardType="numeric"
          value={destinationLng}
          onChangeText={setDestinationLng}
        />

        {type === 'OFFER' ? (
          <TextField
            label="Seats available"
            placeholder="3"
            keyboardType="number-pad"
            value={seatsAvailable}
            onChangeText={setSeatsAvailable}
          />
        ) : null}

        <TextField
          label="Suggested fare (optional)"
          placeholder="8.00"
          keyboardType="decimal-pad"
          value={suggestedFare}
          onChangeText={setSuggestedFare}
        />

        <Text style={styles.disclaimer}>
          Payment is handled directly in cash between members. Community RideShare does not process, hold, or
          guarantee any payment.
        </Text>

        <PrimaryButton title="Post ride" onPress={handleSubmit} loading={submitting} disabled={!canSubmit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 24, paddingBottom: 48 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 16, marginBottom: 8 },
  disclaimer: { fontSize: 12, color: '#6b7280', marginVertical: 16, lineHeight: 18 },
});
