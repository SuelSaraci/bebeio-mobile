import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Animated,
} from 'react-native';
import { Brain, Send } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { keyboardAvoidingBehavior } from '../lib/platform';
import { useToast } from '../components/Toast';
import { api, ApiError, isFreeLimitError } from '../lib/api';
import { openUpgradeWebsiteOnLimit } from '../lib/upgradeWeb';
import { useSubscription } from '../context/SubscriptionContext';
import { buildAiSuggestions } from '../lib/aiSuggestions';
import { getBabyAge } from '../utils';
import { colors } from '../theme/colors';

function TypingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, { toValue: -4, duration: 300, useNativeDriver: true }),
          Animated.timing(value, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(300),
        ]),
      );

    const a1 = bounce(dot1, 0);
    const a2 = bounce(dot2, 150);
    const a3 = bounce(dot3, 300);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.typingRow}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View key={i} style={[styles.dot, { transform: [{ translateY: dot }] }]} />
      ))}
    </View>
  );
}

export function AIScreen() {
  const { baby } = useApp();
  const { refreshSubscriptionState } = useSubscription();
  const { showError } = useToast();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (baby) {
      setMessages([
        {
          role: 'assistant',
          text: `Hi! I'm your Bebio AI assistant. ${baby.name} is ${getBabyAge(baby.birthDate)} — a wonderful stage! I can answer questions about feeding, sleep, vaccinations, milestones, and development using your tracked data. What would you like to know?`,
        },
      ]);
    }
  }, [baby]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, typing]);

  if (!baby) return null;

  const send = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim() || typing) return;

    setInput('');
    const nextMessages = [...messages, { role: 'user' as const, text: msg }];
    setMessages(nextMessages);
    setTyping(true);
    try {
      const history = nextMessages
        .slice(0, -1)
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, text: m.text }));
      const { reply } = await api.chatAi({ message: msg, history });
      setMessages((m) => [...m, { role: 'assistant', text: reply }]);
    } catch (error) {
      if (isFreeLimitError(error)) {
        void openUpgradeWebsiteOnLimit((result) => {
          if (result === 'success') void refreshSubscriptionState();
        });
        return;
      }
      const message =
        error instanceof ApiError
          ? error.message
          : 'Could not reach the AI assistant. Please try again.';
      showError(message);
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: "Sorry, I couldn't connect right now. Please check that the API server is running and GROQ_API_KEY is set.",
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const suggestions = buildAiSuggestions(baby.name);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={keyboardAvoidingBehavior}
      keyboardVerticalOffset={100}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerText}>
            <Text style={styles.title}>AI Assistant</Text>
            <Text style={styles.sub}>Personalized guidance for {baby.name}</Text>
          </View>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestions} contentContainerStyle={styles.suggestionsContent}>
        {suggestions.map((q) => (
          <TouchableOpacity
            key={q}
            style={styles.chip}
            onPress={() => send(q)}
          >
            <Text style={styles.chipText}>{q}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.messagesContent} showsVerticalScrollIndicator={false}>
        {messages.map((msg, i) => (
          <View key={i} style={[styles.row, msg.role === 'user' && styles.rowUser]}>
            {msg.role === 'assistant' && (
              <View style={styles.avatar}>
                <Brain size={14} color={colors.primaryForeground} />
              </View>
            )}
            <View style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}>
              <Text style={[styles.bubbleText, msg.role === 'user' && styles.bubbleTextUser]}>{msg.text}</Text>
            </View>
          </View>
        ))}
        {typing && (
          <View style={styles.row}>
            <View style={styles.avatar}>
              <Brain size={14} color={colors.primaryForeground} />
            </View>
            <View style={[styles.bubble, styles.bubbleAssistant, styles.typing]}>
              <TypingDots />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TouchableOpacity
          style={styles.inputWrap}
          activeOpacity={1}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={`Ask about ${baby.name}'s health, sleep, feeding…`}
            placeholderTextColor={colors.mutedForeground}
            style={styles.input}
            editable={!typing}
            onSubmitEditing={() => !typing && send()}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => send()}
          disabled={typing}
          style={[styles.sendBtn, typing && styles.sendDisabled]}
        >
          <Send size={16} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  header: { marginBottom: 12 },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  headerText: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', color: colors.foreground },
  sub: { fontSize: 14, color: colors.mutedForeground, marginTop: 4 },
  usagePill: {
    backgroundColor: colors.muted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
  },
  usagePillPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.rose200,
  },
  usageTextPremium: { fontSize: 11, fontWeight: '700', color: colors.primary },
  suggestions: { flexGrow: 0, marginBottom: 16 },
  suggestionsContent: { gap: 10, paddingRight: 16, paddingVertical: 2 },
  chip: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  chipText: { fontSize: 12, fontWeight: '500', color: colors.foreground },
  messages: { flex: 1 },
  messagesContent: { gap: 16, paddingBottom: 8 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  rowUser: { flexDirection: 'row-reverse' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: { maxWidth: '82%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16 },
  bubbleUser: { backgroundColor: colors.primary, borderTopRightRadius: 4 },
  bubbleAssistant: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderTopLeftRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20, color: colors.foreground },
  bubbleTextUser: { color: colors.primaryForeground },
  typing: { height: 44, justifyContent: 'center', paddingHorizontal: 20 },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.mutedForeground, opacity: 0.4 },
  inputRow: { flexDirection: 'row', gap: 8, paddingTop: 12 },
  inputWrap: { flex: 1 },
  input: {
    width: '100%',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.foreground,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.5 },
});
