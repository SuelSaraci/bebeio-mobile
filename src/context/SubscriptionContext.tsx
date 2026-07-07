import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged } from "firebase/auth";
import {
  BillingPeriod,
  FeatureLimitKey,
  FREE_FEATURE_LIMIT,
  PaywallReason,
} from "../lib/plans";
import { auth } from "../lib/firebase";
import { api } from "../lib/api";
import {
  canOpenWebCheckout as canOpenWebCheckoutFlag,
  isIosAppStoreCompanionMode,
  openUpgradeWebsite,
  openUpgradeWebsiteOnLimit,
  UPGRADE_WEB_URL,
} from "../lib/upgradeWeb";

const STORAGE = {
  aiCount: "@bebio/subscription/ai_count",
  bannerDismissed: "@bebio/subscription/banner_dismissed",
  aiIntroSeen: "@bebio/subscription/ai_intro_seen",
} as const;

interface SubscriptionContextValue {
  isPremium: boolean;
  isReady: boolean;
  loadingStatus: boolean;
  billingPeriod: BillingPeriod;
  setBillingPeriod: (period: BillingPeriod) => void;
  aiUsed: number;
  aiRemaining: number;
  canUseAi: boolean;
  recordAiMessage: () => Promise<boolean>;
  canAddFeature: (currentCount: number, feature: FeatureLimitKey) => boolean;
  showFeatureLimitPaywall: (feature: FeatureLimitKey) => void;
  /** When a free-tier limit blocks the user (opens web on Android, soft message on iOS). */
  promptFreeLimitReached: (
    reason: PaywallReason,
    feature?: FeatureLimitKey,
  ) => void;
  paywallVisible: boolean;
  paywallReason: PaywallReason;
  paywallFeature: FeatureLimitKey | null;
  openPaywall: (reason?: PaywallReason, feature?: FeatureLimitKey) => void;
  /** Opens /upgrade in browser when allowed; otherwise shows the in-app paywall. */
  openUpgradeFlow: (reason?: PaywallReason, feature?: FeatureLimitKey) => void;
  closePaywall: () => void;
  refreshSubscriptionState: () => Promise<{
    premium: boolean;
    error?: "network";
  }>;
  openUpgradeWebsite: () => Promise<void>;
  canOpenWebCheckout: boolean;
  isCompanionMode: boolean;
  homeBannerVisible: boolean;
  dismissHomeBanner: () => void;
  showAiIntro: boolean;
  dismissAiIntro: () => void;
  upgradeWebUrl: string;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("yearly");
  const [aiUsed, setAiUsed] = useState(0);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallReason, setPaywallReason] = useState<PaywallReason>("manual");
  const [paywallFeature, setPaywallFeature] = useState<FeatureLimitKey | null>(
    null,
  );
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [homeBannerVisible, setHomeBannerVisible] = useState(false);
  const [showAiIntro, setShowAiIntro] = useState(false);

  const refreshSubscriptionState = useCallback(async (): Promise<{
    premium: boolean;
    error?: "network";
  }> => {
    try {
      const response = await api.getSubscriptionStatus();
      const premium = Boolean(response.subscription?.hasPremium);
      setIsPremium(premium);
      if (premium) {
        setHomeBannerVisible(false);
        setShowAiIntro(false);
      }
      return { premium };
    } catch (error) {
      console.warn("[subscription] Failed to load status:", error);
      setIsPremium(false);
      return { premium: false, error: "network" };
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      setLoadingStatus(true);
      try {
        const [aiCount, bannerDismissed, aiIntroSeen] = await Promise.all([
          AsyncStorage.getItem(STORAGE.aiCount),
          AsyncStorage.getItem(STORAGE.bannerDismissed),
          AsyncStorage.getItem(STORAGE.aiIntroSeen),
        ]);

        if (!mounted) return;
        setAiUsed(Number(aiCount) || 0);
        setHomeBannerVisible(bannerDismissed !== "1");
        setShowAiIntro(aiIntroSeen !== "1");

        if (auth.currentUser) {
          await refreshSubscriptionState();
        }
      } finally {
        if (mounted) {
          setLoadingStatus(false);
          setIsReady(true);
        }
      }
    };

    bootstrap();

    const authUnsub = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;
      if (user) {
        await refreshSubscriptionState();
      } else {
        setIsPremium(false);
      }
    });

    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active" && auth.currentUser) {
        refreshSubscriptionState();
      }
    });

    const poll = setInterval(() => {
      if (auth.currentUser) refreshSubscriptionState();
    }, 30000);

    return () => {
      mounted = false;
      authUnsub();
      appStateSub.remove();
      clearInterval(poll);
    };
  }, [refreshSubscriptionState]);

  const openPaywall = useCallback(
    (reason: PaywallReason = "manual", feature?: FeatureLimitKey) => {
      setPaywallReason(reason);
      setPaywallFeature(feature ?? null);
      setPaywallVisible(true);
    },
    [],
  );

  const closePaywall = useCallback(() => {
    setPaywallVisible(false);
  }, []);

  const openUpgradeFlow = useCallback(
    (reason: PaywallReason = "manual", feature?: FeatureLimitKey) => {
      if (canOpenWebCheckoutFlag()) {
        void openUpgradeWebsite((result) => {
          if (result === "success") void refreshSubscriptionState();
        });
        return;
      }
      openPaywall(reason, feature);
    },
    [openPaywall, refreshSubscriptionState],
  );

  /** Free tier limit hit — opens /upgrade in the browser on all platforms. */
  const handleFreeLimitReached = useCallback(
    (_reason: PaywallReason, _feature?: FeatureLimitKey) => {
      void openUpgradeWebsiteOnLimit((result) => {
        if (result === "success") void refreshSubscriptionState();
      });
    },
    [refreshSubscriptionState],
  );

  const canAddFeature = useCallback(
    (currentCount: number, _feature: FeatureLimitKey) => {
      if (isPremium) return true;
      return currentCount < FREE_FEATURE_LIMIT;
    },
    [isPremium],
  );

  const showFeatureLimitPaywall = useCallback((feature: FeatureLimitKey) => {
    console.log('[Bebio/subscription] Free limit reached:', feature);
    void openUpgradeWebsiteOnLimit((result) => {
      if (result === "success") void refreshSubscriptionState();
    });
  }, [refreshSubscriptionState]);

  const recordAiMessage = useCallback(async () => {
    if (isPremium) return true;

    const count = Number(await AsyncStorage.getItem(STORAGE.aiCount)) || 0;
    if (count >= FREE_FEATURE_LIMIT) {
      handleFreeLimitReached("ai_limit");
      return false;
    }

    const next = count + 1;
    setAiUsed(next);
    await AsyncStorage.setItem(STORAGE.aiCount, String(next));
    return true;
  }, [isPremium, handleFreeLimitReached]);

  const dismissHomeBanner = useCallback(async () => {
    setHomeBannerVisible(false);
    await AsyncStorage.setItem(STORAGE.bannerDismissed, "1");
  }, []);

  const dismissAiIntro = useCallback(async () => {
    setShowAiIntro(false);
    await AsyncStorage.setItem(STORAGE.aiIntroSeen, "1");
  }, []);

  const aiRemaining = useMemo(
    () =>
      isPremium
        ? Number.POSITIVE_INFINITY
        : Math.max(0, FREE_FEATURE_LIMIT - aiUsed),
    [aiUsed, isPremium],
  );

  const canUseAi = isPremium || aiUsed < FREE_FEATURE_LIMIT;

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      isPremium,
      isReady,
      loadingStatus,
      billingPeriod,
      setBillingPeriod,
      aiUsed,
      aiRemaining,
      canUseAi,
      recordAiMessage,
      canAddFeature,
      showFeatureLimitPaywall,
      promptFreeLimitReached: handleFreeLimitReached,
      paywallVisible,
      paywallReason,
      paywallFeature,
      openPaywall,
      openUpgradeFlow,
      closePaywall,
      refreshSubscriptionState,
      openUpgradeWebsite,
      canOpenWebCheckout: canOpenWebCheckoutFlag(),
      isCompanionMode: isIosAppStoreCompanionMode(),
      homeBannerVisible,
      dismissHomeBanner,
      showAiIntro,
      dismissAiIntro,
      upgradeWebUrl: UPGRADE_WEB_URL,
    }),
    [
      aiRemaining,
      aiUsed,
      billingPeriod,
      canAddFeature,
      canUseAi,
      closePaywall,
      dismissAiIntro,
      dismissHomeBanner,
      homeBannerVisible,
      isPremium,
      isReady,
      loadingStatus,
      openPaywall,
      openUpgradeFlow,
      paywallFeature,
      paywallReason,
      paywallVisible,
      recordAiMessage,
      refreshSubscriptionState,
      showAiIntro,
      showFeatureLimitPaywall,
      handleFreeLimitReached,
    ],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return ctx;
}
