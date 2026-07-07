import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { GoogleIcon } from './GoogleIcon';
import { colors } from '../theme/colors';
import { signInWithGoogleIdToken, mapFirebaseAuthError } from '../lib/auth';
import {
  resolveGoogleAuthConfig,
  useGoogleIdTokenSignIn,
  type GoogleAuthConfig,
} from '../lib/googleAuth';

WebBrowser.maybeCompleteAuthSession();

const setupMessages: Record<string, string> = {
  'missing-web':
    'Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to bebeio-mobile/.env (Firebase → Authentication → Google → Web client ID), then restart Expo.',
  'missing-ios':
    'On iOS you need a separate OAuth client. In Google Cloud Console → Credentials → Create OAuth client ID → iOS, bundle ID: com.bebeio.mobile. Add EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID to .env, then run: npx expo run:ios',
  'missing-android':
    'On Android create an OAuth client (package com.bebeio.mobile, SHA-1 from your upload keystore or `eas credentials`) and set EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID in .env, then rebuild the app.',
};

function GoogleSignInButtonInner({
  config,
  onSuccess,
  onError,
  disabled,
  label = 'Continue with Google',
}: {
  config: GoogleAuthConfig;
  onSuccess: () => void;
  onError: (message: string) => void;
  disabled?: boolean;
  label?: string;
}) {
  const [request, response, promptAsync] = useGoogleIdTokenSignIn(config);
  const [busy, setBusy] = React.useState(false);

  useEffect(() => {
    if (!response) return;

    if (response.type === 'success') {
      const idToken = response.params.id_token;
      if (!idToken) {
        onError('Google sign in failed. No token received.');
        setBusy(false);
        return;
      }
      signInWithGoogleIdToken(idToken)
        .then(() => onSuccess())
        .catch((error: unknown) => {
          const code = (error as { code?: string })?.code;
          onError(
            code
              ? mapFirebaseAuthError(code)
              : error instanceof Error
                ? error.message
                : 'Google sign in failed.',
          );
        })
        .finally(() => setBusy(false));
      return;
    }

    if (response.type === 'error') {
      onError('Google sign in failed. Please try again.');
      setBusy(false);
      return;
    }

    if (response.type === 'dismiss' || response.type === 'cancel') {
      setBusy(false);
    }
  }, [response, onSuccess, onError]);

  const isDisabled = disabled || busy || !request;

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.disabled]}
      onPress={() => {
        setBusy(true);
        promptAsync({ useProxy: false });
      }}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {busy ? (
        <ActivityIndicator color={colors.foreground} />
      ) : (
        <>
          <GoogleIcon />
          <Text style={styles.label}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export function GoogleSignInButton({
  onSuccess,
  onError,
  disabled,
  label,
}: {
  onSuccess: () => void;
  onError: (message: string) => void;
  disabled?: boolean;
  label?: string;
}) {
  const resolved = resolveGoogleAuthConfig();

  if (!resolved.ok) {
    return <Text style={styles.missingConfig}>{setupMessages[resolved.reason]}</Text>;
  }

  return (
    <GoogleSignInButtonInner
      config={resolved.config}
      onSuccess={onSuccess}
      onError={onError}
      disabled={disabled}
      label={label}
    />
  );
}

export function AuthDivider() {
  return <Text style={styles.divider}>or</Text>;
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  disabled: {
    opacity: 0.5,
  },
  divider: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.mutedForeground,
    fontWeight: '500',
    marginVertical: 20,
  },
  missingConfig: {
    fontSize: 12,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
});
