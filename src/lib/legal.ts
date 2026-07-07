import { Linking } from 'react-native';

export const TERMS_URL =
  process.env.EXPO_PUBLIC_TERMS_URL?.trim() || 'https://bebeio.com/terms';

export const PRIVACY_URL =
  process.env.EXPO_PUBLIC_PRIVACY_URL?.trim() || 'https://bebeio.com/privacy';

export function openLegalUrl(url: string) {
  Linking.openURL(url).catch(() => {
    // Ignore — user may not have a browser handler in rare cases.
  });
}
