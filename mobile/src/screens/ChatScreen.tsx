import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../auth/AuthContext';
import { useSocket } from '../realtime/SocketContext';
import { listMessages, sendMessage } from '../api/chat';
import { ApiError } from '../api/client';
import type { ChatMessage } from '../api/types';
import { getOtherParticipant } from '../rides/roles';

type Props = NativeStackScreenProps<AppStackParamList, 'Chat'>;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function ChatScreen({ route, navigation }: Props) {
  const { ride } = route.params;
  const { user, accessToken } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const myId = user?.id;
  const other = myId ? getOtherParticipant(ride, myId) : null;
  const matchId = ride.match?.id;

  useEffect(() => {
    navigation.setOptions({ title: other?.name ? `Chat with ${other.name}` : 'Chat' });
  }, [navigation, other]);

  useEffect(() => {
    if (!accessToken) return;
    listMessages(accessToken, ride.id)
      .then(setMessages)
      .catch((err) => {
        Alert.alert('Could not load chat', err instanceof ApiError ? err.message : 'Please try again.');
      })
      .finally(() => setLoading(false));
  }, [accessToken, ride.id]);

  useEffect(() => {
    if (!socket) return;
    const onMessage = (message: ChatMessage) => {
      if (message.rideMatchId !== matchId) return;
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    };
    socket.on('message:new', onMessage);
    return () => {
      socket.off('message:new', onMessage);
    };
  }, [socket, matchId]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !accessToken) return;
    setSending(true);
    try {
      const message = await sendMessage(accessToken, ride.id, trimmed);
      setMessages((prev) => [...prev, message]);
      setText('');
    } catch (err) {
      Alert.alert('Could not send', err instanceof ApiError ? err.message : 'Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          loading ? null : <Text style={styles.empty}>Say hello and coordinate your pickup.</Text>
        }
        renderItem={({ item }) => {
          const mine = item.senderId === myId;
          return (
            <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={mine ? styles.bubbleTextMine : styles.bubbleTextTheirs}>{item.text}</Text>
                <Text style={mine ? styles.timeMine : styles.timeTheirs}>{formatTime(item.sentAt)}</Text>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Message"
          placeholderTextColor="#9aa0a6"
          value={text}
          onChangeText={setText}
          multiline
        />
        <Pressable
          style={[styles.sendButton, (!text.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  list: { padding: 16, flexGrow: 1 },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 40, fontSize: 14 },
  bubbleRow: { flexDirection: 'row', marginBottom: 10 },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 9 },
  bubbleMine: { backgroundColor: '#2563eb', borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: '#f3f4f6', borderBottomLeftRadius: 4 },
  bubbleTextMine: { color: '#fff', fontSize: 15 },
  bubbleTextTheirs: { color: '#111827', fontSize: 15 },
  timeMine: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 3, textAlign: 'right' },
  timeTheirs: { color: '#9ca3af', fontSize: 10, marginTop: 3 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: { backgroundColor: '#2563eb', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10 },
  sendButtonDisabled: { opacity: 0.5 },
  sendText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
