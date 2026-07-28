import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../auth/AuthContext';
import { rateRide } from '../api/ratings';
import { ApiError } from '../api/client';
import { getOtherParticipant } from '../rides/roles';
import { StarRating } from '../components/StarRating';
import { TextField } from '../components/TextField';
import { PrimaryButton } from '../components/PrimaryButton';

type Props = NativeStackScreenProps<AppStackParamList, 'Rating'>;

export default function RatingScreen({ route, navigation }: Props) {
  const { ride } = route.params;
  const { user, accessToken } = useAuth();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const other = user ? getOtherParticipant(ride, user.id) : null;

  const handleSubmit = async () => {
    if (!accessToken || stars === 0) return;
    setSubmitting(true);
    try {
      await rateRide(accessToken, ride.id, stars, comment.trim() || undefined);
      Alert.alert('Thanks!', 'Your rating was submitted.');
      navigation.goBack();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        Alert.alert('Already rated', "You've already rated this ride.");
        navigation.goBack();
        return;
      }
      Alert.alert('Could not submit rating', err instanceof ApiError ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>Rate your ride</Text>
      <Text style={styles.subtitle}>
        How was {other?.name ?? 'the other member'} as {ride.type === 'REQUEST' ? 'your driver' : 'your rider'}?
      </Text>

      <View style={styles.starsWrap}>
        <StarRating value={stars} onChange={setStars} />
      </View>

      <TextField
        label="Comment (optional)"
        placeholder="Anything worth mentioning?"
        value={comment}
        onChangeText={setComment}
        multiline
      />

      <PrimaryButton title="Submit rating" onPress={handleSubmit} loading={submitting} disabled={stars === 0} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 24 },
  starsWrap: { alignItems: 'center', marginBottom: 28 },
});
