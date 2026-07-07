import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, X } from 'lucide-react-native';
import { useSubscription } from '../context/SubscriptionContext';
import { useApp } from '../context/AppContext';
import { colors } from '../theme/colors';

export function PremiumBanner() {
  const { baby } = useApp();
  const {
    isPremium,
    homeBannerVisible,
    openPaywall,
    dismissHomeBanner,
    isCompanionMode,
  } = useSubscription();

  if (isPremium || !homeBannerVisible || isCompanionMode) return null;

  return (
    <Pressable onPress={() => openPaywall('manual')} style={styles.wrap}>
      <LinearGradient
        colors={[colors.violet500, colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.iconWrap}>
          <Sparkles size={18} color="#fff" />
        </View>
        <View style={styles.body}>
          <Text style={styles.title}>Upgrade to Bebio Plus</Text>
          <Text style={styles.sub}>
            Unlimited tracking and AI{baby ? ` for ${baby.name}` : ''} — subscribe on bebeio.com
          </Text>
        </View>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation?.();
            dismissHomeBanner();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.dismiss}
          accessibilityLabel="Dismiss"
        >
          <X size={16} color="rgba(255,255,255,0.85)" />
        </TouchableOpacity>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  card: {
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  sub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 16,
  },
  dismiss: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
