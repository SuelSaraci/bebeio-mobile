import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Baby, Eye, EyeOff } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { FL, TI, PBtn } from '../components/ui';
import { keyboardAvoidingBehavior } from '../lib/platform';
import { AuthDivider, GoogleSignInButton } from '../components/GoogleSignInButton';
import { colors } from '../theme/colors';
import {
  validateLogin,
  hasErrors,
  firstError,
  clearFieldError,
  type FieldErrors,
} from '../lib/validation';

export function LoginScreen() {
  const { login, setScreen, loading } = useApp();
  const { showError, showSuccess } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const submit = async () => {
    const errors = validateLogin({ email, password });
    if (hasErrors(errors)) {
      setFieldErrors(errors);
      showError(firstError(errors));
      return;
    }
    setFieldErrors({});
    try {
      await login(email, password);
      showSuccess('Welcome back!');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Sign in failed.';
      showError(message);
      setFieldErrors({ password: message });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={keyboardAvoidingBehavior}
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
          <TI
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setFieldErrors((prev) => clearFieldError(prev, 'email'));
            }}
            placeholder="you@example.com"
            keyboardType="email-address"
            error={fieldErrors.email}
          />
          <FL>Password</FL>
          <View>
            <TI
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setFieldErrors((prev) => clearFieldError(prev, 'password'));
              }}
              placeholder="••••••••"
              secureTextEntry={!showPw}
              error={fieldErrors.password}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw(!showPw)}>
              {showPw ? <EyeOff size={15} color={colors.mutedForeground} /> : <Eye size={15} color={colors.mutedForeground} />}
            </TouchableOpacity>
          </View>
          <PBtn onPress={submit} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.primaryForeground} /> : 'Sign In'}
          </PBtn>
        </View>

        <AuthDivider />
        <GoogleSignInButton
          disabled={loading}
          onSuccess={() => showSuccess('Welcome back!')}
          onError={(msg) => {
            if (!msg.toLowerCase().includes('cancel')) showError(msg);
          }}
        />

        <Text style={styles.footer}>
          New to Bebio?{' '}
          <Text style={styles.link} onPress={() => setScreen('signup')}>
            Create account
          </Text>
        </Text>
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
  footer: { textAlign: 'center', fontSize: 14, color: colors.mutedForeground, marginTop: 24 },
  link: { color: colors.primary, fontWeight: '700' },
});
