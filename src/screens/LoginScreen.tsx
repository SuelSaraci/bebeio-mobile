import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Baby, Eye, EyeOff } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { FL, TI, PBtn } from '../components/ui';
import { colors } from '../theme/colors';

export function LoginScreen() {
  const { setScreen } = useApp();
  const [email, setEmail] = useState('sarah@example.com');
  const [password, setPassword] = useState('••••••••');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const submit = () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setScreen('setup');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrap}>
          <View style={styles.logo}>
            <Baby size={30} color={colors.primaryForeground} />
          </View>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.sub}>Sign in to continue tracking</Text>
        </View>

        <View style={styles.form}>
          <FL>Email</FL>
          <TI value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
          <FL>Password</FL>
          <View>
            <TI
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPw}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw(!showPw)}>
              {showPw ? <EyeOff size={15} color={colors.mutedForeground} /> : <Eye size={15} color={colors.mutedForeground} />}
            </TouchableOpacity>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PBtn onPress={submit}>Sign In</PBtn>
        </View>

        <Text style={styles.footer}>
          New to Bebio?{' '}
          <Text style={styles.link} onPress={() => setScreen('signup')}>
            Create account
          </Text>
        </Text>

        <View style={styles.demo}>
          <Text style={styles.demoText}>Demo mode — any credentials work</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 64 },
  logoWrap: { alignItems: 'center', marginBottom: 40 },
  logo: {
    width: 64,
    height: 64,
    backgroundColor: colors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heading: { fontSize: 28, fontWeight: '700', color: colors.foreground },
  sub: { fontSize: 14, color: colors.mutedForeground, marginTop: 4 },
  form: { gap: 0 },
  eyeBtn: { position: 'absolute', right: 12, top: 12 },
  error: { fontSize: 12, color: colors.red500, fontWeight: '500', marginBottom: 8 },
  footer: { textAlign: 'center', fontSize: 14, color: colors.mutedForeground, marginTop: 24 },
  link: { color: colors.primary, fontWeight: '700' },
  demo: {
    marginTop: 32,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  demoText: { fontSize: 12, color: colors.mutedForeground },
});
