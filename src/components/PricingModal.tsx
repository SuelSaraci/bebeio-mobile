import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, Sparkles, RefreshCw, ExternalLink } from 'lucide-react-native';
import { useSubscription } from '../context/SubscriptionContext';
import { useToast } from '../components/Toast';
import { useApp } from '../context/AppContext';
import {
  PLANS,
  planPrice,
  paywallHeadline,
  paywallSubtitle,
} from '../lib/plans';
import { openLegalUrl, PRIVACY_URL, TERMS_URL } from '../lib/legal';
import { colors } from '../theme/colors';

export function PricingModal() {
  const insets = useSafeAreaInsets();
  const { baby } = useApp();
  const {
    paywallVisible,
    paywallReason,
    paywallFeature,
    closePaywall,
    billingPeriod,
    setBillingPeriod,
    refreshSubscriptionState,
    openUpgradeWebsite,
    canOpenWebCheckout,
    isCompanionMode,
  } = useSubscription();
  const { showSuccess } = useToast();

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<
    'idle' | 'success' | 'no_access' | 'network_error'
  >('idle');

  const showPricing = canOpenWebCheckout;
  const pricing = planPrice(billingPeriod);
  const headline = paywallHeadline(
    paywallReason,
    baby?.name,
    paywallFeature ?? undefined,
    isCompanionMode,
  );
  const subtitle = paywallSubtitle(
    paywallReason,
    baby?.name,
    paywallFeature ?? undefined,
    isCompanionMode,
  );

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult('idle');
    try {
      const { premium, error } = await refreshSubscriptionState();
      if (premium) {
        setSyncResult('success');
        showSuccess('Bebio Plus is active on your account.');
        setTimeout(() => closePaywall(), 800);
        return;
      }
      if (error === 'network') {
        setSyncResult('network_error');
        return;
      }
      setSyncResult('no_access');
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenWeb = async () => {
    await openUpgradeWebsite();
  };

  return (
    <Modal
      visible={paywallVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={closePaywall}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={closePaywall}
            style={styles.closeBtn}
            accessibilityLabel="Close"
          >
            <X size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={[colors.primary, colors.rose600]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroIcon}>
              <Sparkles size={22} color={colors.primaryForeground} />
            </View>
            <Text style={styles.heroTitle}>{headline}</Text>
            <Text style={styles.heroSub}>{subtitle}</Text>
          </LinearGradient>

          {showPricing ? (
            <View style={styles.toggleWrap}>
              <Pressable
                onPress={() => setBillingPeriod('monthly')}
                style={[styles.toggleBtn, billingPeriod === 'monthly' && styles.toggleActive]}
              >
                <Text style={[styles.toggleText, billingPeriod === 'monthly' && styles.toggleTextActive]}>
                  Monthly
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setBillingPeriod('yearly')}
                style={[styles.toggleBtn, billingPeriod === 'yearly' && styles.toggleActive]}
              >
                <Text style={[styles.toggleText, billingPeriod === 'yearly' && styles.toggleTextActive]}>
                  Yearly
                </Text>
                {'savings' in pricing && pricing.savings ? (
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveBadgeText}>Save {pricing.savings}%</Text>
                  </View>
                ) : null}
              </Pressable>
            </View>
          ) : null}

          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <View>
                <Text style={styles.planName}>{PLANS.plus.name}</Text>
                <Text style={styles.planTagline}>Unlimited tracking & AI</Text>
              </View>
              {showPricing ? (
                <View style={styles.priceCol}>
                  <Text style={styles.priceMain}>{pricing.label}</Text>
                  {billingPeriod === 'yearly' && pricing.perMonth ? (
                    <Text style={styles.priceSub}>{pricing.perMonth}</Text>
                  ) : null}
                </View>
              ) : null}
            </View>

            <View style={styles.divider} />

            {PLANS.plus.features.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <View style={styles.checkIcon}>
                  <Check size={14} color={colors.primary} strokeWidth={3} />
                </View>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {isCompanionMode ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Sync your account</Text>
              <Text style={styles.infoText}>
                This checks whether Bebio Plus is already active on your signed-in
                account. It does not open a browser or start checkout.
              </Text>
              {syncResult === 'success' ? (
                <Text style={styles.syncSuccess}>Bebio Plus is active. Unlocking…</Text>
              ) : null}
              {syncResult === 'no_access' ? (
                <Text style={styles.syncError}>
                  No Bebio Plus access found for this account. If you subscribed
                  elsewhere, make sure you use the same login here.
                </Text>
              ) : null}
              {syncResult === 'network_error' ? (
                <Text style={styles.syncError}>
                  Could not reach the server. Check that bebeio-api is running and
                  EXPO_PUBLIC_API_URL is correct.
                </Text>
              ) : null}
            </View>
          ) : showPricing ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Checkout on bebeio.com</Text>
              <Text style={styles.infoText}>
                Use the same account in the app and on the website. After paying,
                return here and tap sync.
              </Text>
            </View>
          ) : null}

          <View style={styles.legalRow}>
            <TouchableOpacity onPress={() => openLegalUrl(TERMS_URL)}>
              <Text style={styles.legalLink}>Terms</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openLegalUrl(PRIVACY_URL)}>
              <Text style={styles.legalLink}>Privacy</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {showPricing ? (
            <TouchableOpacity
              onPress={handleOpenWeb}
              style={styles.cta}
              activeOpacity={0.85}
            >
              <View style={styles.ctaInner}>
                <ExternalLink size={16} color={colors.primaryForeground} />
                <Text style={styles.ctaText}>Subscribe on website</Text>
              </View>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={handleSync}
            disabled={syncing}
            style={[
              showPricing ? styles.ctaSecondary : styles.cta,
              syncing && styles.ctaDisabled,
            ]}
            activeOpacity={0.85}
          >
            {syncing ? (
              <ActivityIndicator color={showPricing ? colors.primary : colors.primaryForeground} />
            ) : (
              <View style={styles.ctaInner}>
                <RefreshCw size={16} color={showPricing ? colors.primary : colors.primaryForeground} />
                <Text style={[styles.ctaText, showPricing && styles.ctaTextSecondary]}>
                  {isCompanionMode ? 'Sync account' : 'Refresh subscription status'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={closePaywall} style={styles.secondaryBtn}>
            <Text style={styles.secondaryText}>Continue with Free</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: 20, paddingBottom: 20, gap: 20 },
  scroll: { flex: 1 },
  hero: {
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.primaryForeground,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.9)',
  },
  toggleWrap: {
    flexDirection: 'row',
    backgroundColor: colors.muted,
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  toggleActive: {
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  toggleTextActive: {
    color: colors.foreground,
  },
  saveBadge: {
    backgroundColor: colors.secondary,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  saveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  planCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
  },
  planTagline: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  priceCol: { alignItems: 'flex-end' },
  priceMain: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.foreground,
  },
  priceSub: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.foreground,
  },
  infoCard: {
    backgroundColor: colors.secondary,
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.mutedForeground,
  },
  syncSuccess: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    color: colors.green700,
    marginTop: 4,
  },
  syncError: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    color: colors.red600,
    marginTop: 4,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  legalLink: {
    fontSize: 12,
    color: colors.mutedForeground,
    textDecorationLine: 'underline',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaSecondary: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  ctaDisabled: { opacity: 0.7 },
  ctaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaText: {
    color: colors.primaryForeground,
    fontSize: 16,
    fontWeight: '700',
  },
  ctaTextSecondary: {
    color: colors.primary,
  },
  secondaryBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
});
