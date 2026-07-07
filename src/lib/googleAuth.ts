import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';

export type GoogleAuthConfig = {
  webClientId: string;
  iosClientId: string;
  androidClientId: string;
};

export type GoogleAuthConfigResult =
  | { ok: true; config: GoogleAuthConfig }
  | { ok: false; reason: 'missing-web' | 'missing-ios' | 'missing-android' };

/** Google iOS/Android OAuth redirect scheme (reversed client id). */
export function googleNativeRedirectUri(clientId: string): string {
  return `${clientId.split('.').reverse().join('.')}:/oauthredirect`;
}

export function resolveGoogleAuthConfig(): GoogleAuthConfigResult {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  if (!webClientId) return { ok: false, reason: 'missing-web' };

  if (Platform.OS === 'ios') {
    const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
    if (!iosClientId) return { ok: false, reason: 'missing-ios' };
    return {
      ok: true,
      config: {
        webClientId,
        iosClientId,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || webClientId,
      },
    };
  }

  if (Platform.OS === 'android') {
    const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim();
    if (!androidClientId) return { ok: false, reason: 'missing-android' };
    return {
      ok: true,
      config: {
        webClientId,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || webClientId,
        androidClientId,
      },
    };
  }

  return {
    ok: true,
    config: { webClientId, iosClientId: webClientId, androidClientId: webClientId },
  };
}

/** Native Google sign-in for Firebase (requires platform OAuth client IDs). */
export function useGoogleIdTokenSignIn(config: GoogleAuthConfig) {
  const platformClientId = Platform.OS === 'ios' ? config.iosClientId : config.androidClientId;
  const redirectUri =
    Platform.OS === 'ios' || Platform.OS === 'android'
      ? googleNativeRedirectUri(platformClientId)
      : undefined;

  if (__DEV__ && redirectUri) {
    console.info('[Google Auth] redirect_uri:', redirectUri);
  }

  return Google.useIdTokenAuthRequest({
    webClientId: config.webClientId,
    iosClientId: config.iosClientId,
    androidClientId: config.androidClientId,
    redirectUri,
  });
}
