import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Alert, Platform } from 'react-native';

const WEB_URL =
  process.env.EXPO_PUBLIC_WEB_URL?.trim() || 'https://bebeio.com';

export const UPGRADE_WEB_URL = `${WEB_URL.replace(/\/$/, '')}/upgrade`;

export type UpgradeBrowserResult = 'success' | 'cancel' | 'dismiss' | 'error';

/** Deep link that closes the in-app browser after checkout (Expo Go + prod). */
export function getAppUpgradeReturnUrl(): string {
  return Linking.createURL('upgrade/success');
}

function buildUpgradeUrlForApp(): { openUrl: string; returnUrl: string } {
  const returnUrl = getAppUpgradeReturnUrl();
  const openUrl = `${UPGRADE_WEB_URL}?returnToApp=1&returnUrl=${encodeURIComponent(returnUrl)}`;
  return { openUrl, returnUrl };
}

/**
 * Production iOS builds follow App Store Guideline 3.1.3(f): free companion to a
 * paid web service — no in-app purchase UI and no links/CTAs to external checkout.
 */
export function isIosAppStoreCompanionMode(): boolean {
  const preview =
    process.env.EXPO_PUBLIC_PREVIEW_IOS_APP_STORE_UI?.trim() === 'true';
  if (preview && Platform.OS === 'ios') return true;
  return Platform.OS === 'ios' && !__DEV__;
}

/** Android + dev builds may open Paddle checkout on the website. */
export function canOpenWebCheckout(): boolean {
  return !isIosAppStoreCompanionMode();
}

/** Preload the in-app browser so checkout opens faster. */
export function warmUpUpgradeBrowser() {
  void WebBrowser.warmUpAsync();
}

async function openUrlDirect(
  url: string,
  returnUrl?: string,
): Promise<UpgradeBrowserResult> {
  console.log('[Bebio/upgrade] Opening URL:', url, { returnUrl });

  if (returnUrl) {
    try {
      const result = await WebBrowser.openAuthSessionAsync(url, returnUrl);
      console.log('[Bebio/upgrade] Auth session result:', result);
      if (result.type === 'success') return 'success';
      if (result.type === 'cancel') return 'cancel';
      return 'dismiss';
    } catch (error) {
      console.warn('[Bebio/upgrade] openAuthSessionAsync failed:', error);
    }
  }

  try {
    const result = await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.AUTOMATIC,
      dismissButtonStyle: 'close',
      enableBarCollapsing: true,
    });
    console.log('[Bebio/upgrade] WebBrowser result:', result);
    return result.type === 'cancel' ? 'cancel' : 'dismiss';
  } catch (error) {
    console.warn('[Bebio/upgrade] WebBrowser failed:', error);
    return 'error';
  }
}

function promptUpgrade(
  onComplete?: (result: UpgradeBrowserResult) => void,
): void {
  const { openUrl, returnUrl } = buildUpgradeUrlForApp();

  Alert.alert(
    'Free limit reached',
    "You've reached the free plan limit. Upgrade to Bebio Plus on our website for unlimited access.",
    [
      { text: 'Not now', style: 'cancel', onPress: () => onComplete?.('cancel') },
      {
        text: 'Upgrade',
        onPress: () => {
          void openUrlDirect(openUrl, returnUrl).then((result) => {
            onComplete?.(result);
          });
        },
      },
    ],
  );
}

export async function openUpgradeWebsite(
  onComplete?: (result: UpgradeBrowserResult) => void,
): Promise<UpgradeBrowserResult> {
  if (!canOpenWebCheckout()) return 'cancel';

  if (Platform.OS === 'ios') {
    promptUpgrade(onComplete);
    return 'dismiss';
  }

  const { openUrl, returnUrl } = buildUpgradeUrlForApp();
  const result = await openUrlDirect(openUrl, returnUrl);
  onComplete?.(result);
  return result;
}

/**
 * Opens /upgrade when the API reports FREE_LIMIT_REACHED.
 * Uses an auth session so the in-app browser closes when checkout redirects back.
 */
export async function openUpgradeWebsiteOnLimit(
  onComplete?: (result: UpgradeBrowserResult) => void,
): Promise<UpgradeBrowserResult> {
  if (Platform.OS === 'ios') {
    promptUpgrade(onComplete);
    return 'dismiss';
  }

  const { openUrl, returnUrl } = buildUpgradeUrlForApp();
  const result = await openUrlDirect(openUrl, returnUrl);
  onComplete?.(result);
  return result;
}
