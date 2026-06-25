import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Brain, Send } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { getAIReply } from '../ai';
import { getBabyAge } from '../utils';
import { colors } from '../theme/colors';

export function AIScreen() {
  const { baby } = useApp();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (baby) {
      setMessages([
        {
          role: 'assistant',
          text: `Hi! 👋 I'm your Bebio AI assistant. ${baby.name} is ${getBabyAge(baby.birthDate)} — a wonderful stage! I can answer questions about feeding, sleep, vaccinations, milestones, and development. What would you like to know?`,
        },
      ]);
    }
  }, [baby]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, typing]);

  if (!baby) return null;

  const send = (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: msg }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { role: 'assistant', text: getAIReply(msg, baby.name) }]);
    }, 900 + Math.random() * 600);
  };

  const suggestions = [
    `Is ${baby.name} sleeping enough?`,
    'When can we start solid foods?',
    'How do I handle colic?',
    'What milestones should I expect?',
    'When are vaccinations due?',
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <View style={styles.header}>
        <Text style={styles.title}>AI Assistant</Text>
        <Text style={styles.sub}>Personalized guidance for {baby.name}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestions} contentContainerStyle={styles.suggestionsContent}>
        {suggestions.map((q) => (
          <TouchableOpacity key={q} style={styles.chip} onPress={() => send(q)}>
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
              <Text style={styles.typingText}>...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={`Ask about ${baby.name}'s health, sleep, feeding…`}
          placeholderTextColor={colors.mutedForeground}
          style={styles.input}
          onSubmitEditing={() => !typing && send()}
        />
        <TouchableOpacity onPress={() => send()} disabled={typing} style={[styles.sendBtn, typing && styles.sendDisabled]}>
          <Send size={16} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  header: { marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: colors.foreground },
  sub: { fontSize: 14, color: colors.mutedForeground, marginTop: 2 },
  suggestions: { maxHeight: 44, marginBottom: 8 },
  suggestionsContent: { gap: 8, paddingRight: 16 },
  chip: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  typing: { height: 44, justifyContent: 'center' },
  typingText: { color: colors.mutedForeground, fontSize: 18 },
  inputRow: { flexDirection: 'row', gap: 8, paddingTop: 12 },
  input: {
    flex: 1,
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
