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
  validateSignup,
  hasErrors,
  firstError,
  clearFieldError,
  type FieldErrors,
} from '../lib/validation';

export function SignupScreen() {
  const { signup, setScreen, loading } = useApp();
  const { showError, showSuccess } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const submit = async () => {
    const errors = validateSignup({ name, email, password });
    if (hasErrors(errors)) {
      setFieldErrors(errors);
      showError(firstError(errors));
      return;
    }
    setFieldErrors({});
    try {
      await signup(name, email, password);
      showSuccess("Account created! Let's set up your baby profile.");
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Sign up failed.';
      showError(message);
      if (message.toLowerCase().includes('email')) {
        setFieldErrors({ email: message });
      } else if (message.toLowerCase().includes('password')) {
        setFieldErrors({ password: message });
      }
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
          <Text style={styles.heading}>Create Account</Text>
          <Text style={styles.sub}>Start tracking your baby's journey</Text>
        </View>

        <View style={styles.form}>
          <FL>Your Name</FL>
          <TI
            value={name}
            onChangeText={(text) => {
              setName(text);
              setFieldErrors((prev) => clearFieldError(prev, 'name'));
            }}
            placeholder="Sarah Johnson"
            error={fieldErrors.name}
          />
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
              placeholder="Min. 6 characters"
              secureTextEntry={!showPw}
              error={fieldErrors.password}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw(!showPw)}>
              {showPw ? <EyeOff size={15} color={colors.mutedForeground} /> : <Eye size={15} color={colors.mutedForeground} />}
            </TouchableOpacity>
          </View>
          <PBtn onPress={submit} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.primaryForeground} /> : 'Create Account'}
          </PBtn>
        </View>

        <AuthDivider />
        <GoogleSignInButton
          disabled={loading}
          onSuccess={() => showSuccess('Signed in with Google!')}
          onError={(msg) => {
            if (!msg.toLowerCase().includes('cancel')) showError(msg);
          }}
        />

        <Text style={styles.footer}>
          Already have an account?{' '}
          <Text style={styles.link} onPress={() => setScreen('login')}>
            Sign in
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
