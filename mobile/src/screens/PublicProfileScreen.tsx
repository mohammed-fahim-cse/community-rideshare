import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../auth/AuthContext';
import { getPublicProfile } from '../api/users';
import { blockUser } from '../api/blocks';
import { createReport } from '../api/reports';
import { ApiError } from '../api/client';
import type { PublicUser } from '../api/types';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextField } from '../components/TextField';

type Props = NativeStackScreenProps<AppStackParamList, 'PublicProfile'>;

export default function PublicProfileScreen({ route, navigation }: Props) {
  const { userId } = route.params;
  const { accessToken } = useAuth();
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [blocking, setBlocking] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    getPublicProfile(accessToken, userId)
      .then((p) => {
        setProfile(p);
        navigation.setOptions({ title: p.name ?? 'Member' });
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [accessToken, userId, navigation]);

  const handleBlock = () => {
    Alert.alert('Block this member?', "You won't be matched with them again.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          if (!accessToken) return;
          setBlocking(true);
          try {
            await blockUser(accessToken, userId);
            Alert.alert('Blocked', 'This member has been blocked.');
            navigation.goBack();
          } catch (err) {
            Alert.alert('Could not block', err instanceof ApiError ? err.message : 'Please try again.');
          } finally {
            setBlocking(false);
          }
        },
      },
    ]);
  };

  const handleReport = async () => {
    if (!accessToken || !reportReason.trim()) return;
    setReporting(true);
    try {
      await createReport(accessToken, { reportedUserId: userId, reason: reportReason.trim() });
      Alert.alert('Report submitted', 'A community admin will review it.');
      setShowReportForm(false);
      setReportReason('');
    } catch (err) {
      Alert.alert('Could not submit report', err instanceof ApiError ? err.message : 'Please try again.');
    } finally {
      setReporting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>This member's profile isn't available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{profile.name ?? 'Member'}</Text>
      <Text style={styles.rating}>
        ★ {profile.ratingAvg.toFixed(1)} · {profile.ratingCount} rating{profile.ratingCount === 1 ? '' : 's'}
      </Text>

      {profile.phone ? (
        <PrimaryButton
          title={`📞 ${profile.phone}`}
          variant="secondary"
          onPress={() => Linking.openURL(`tel:${profile.phone}`).catch(() => {})}
        />
      ) : (
        <Text style={styles.hidden}>Phone number is shared once a ride together is accepted.</Text>
      )}

      <View style={styles.divider} />

      {showReportForm ? (
        <View style={styles.reportForm}>
          <TextField
            label="Reason for reporting"
            placeholder="What happened?"
            value={reportReason}
            onChangeText={setReportReason}
            multiline
          />
          <View style={styles.reportFormActions}>
            <View style={styles.reportFormButton}>
              <PrimaryButton title="Cancel" variant="secondary" onPress={() => setShowReportForm(false)} />
            </View>
            <View style={styles.reportFormButton}>
              <PrimaryButton
                title="Submit report"
                onPress={handleReport}
                loading={reporting}
                disabled={!reportReason.trim()}
              />
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.trustActions}>
          <PrimaryButton title="Report member" variant="secondary" onPress={() => setShowReportForm(true)} />
          <PrimaryButton title="Block member" variant="secondary" onPress={handleBlock} loading={blocking} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  notFound: { color: '#6b7280', fontSize: 14 },
  container: { flex: 1, padding: 24, backgroundColor: '#fff', alignItems: 'center', paddingTop: 48, gap: 8 },
  name: { fontSize: 22, fontWeight: '700', color: '#111827' },
  rating: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  hidden: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },
  divider: { height: 1, alignSelf: 'stretch', backgroundColor: '#e5e7eb', marginVertical: 20 },
  trustActions: { alignSelf: 'stretch', gap: 12 },
  reportForm: { alignSelf: 'stretch', gap: 12 },
  reportFormActions: { flexDirection: 'row', gap: 12 },
  reportFormButton: { flex: 1 },
});
