export type BillingPeriod = 'monthly' | 'yearly';

export type FeatureLimitKey =
  | 'feeding'
  | 'sleep'
  | 'diaper'
  | 'growth'
  | 'ai'
  | 'milestone'
  | 'vaccination'
  | 'appointment'
  | 'med_note';

export type PaywallReason = 'manual' | 'ai_limit' | 'ai_tab' | 'feature_limit';

export const FREE_FEATURE_LIMIT = 3;

/** @deprecated Use FREE_FEATURE_LIMIT */
export const FREE_AI_DAILY_LIMIT = FREE_FEATURE_LIMIT;

export interface PlanFeature {
  label: string;
  included: boolean;
}

export const FEATURE_LIMIT_LABELS: Record<FeatureLimitKey, string> = {
  feeding: 'feeding logs',
  sleep: 'sleep sessions',
  diaper: 'diaper changes',
  growth: 'growth measurements',
  ai: 'AI questions',
  milestone: 'custom milestones',
  vaccination: 'vaccinations',
  appointment: 'appointments',
  med_note: 'medical notes',
};

export const PLANS = {
  plus: {
    id: 'plus' as const,
    name: 'Bebio Plus',
    monthlyPrice: 5,
    yearlyPrice: 50,
    currency: '$',
    features: [
      'Unlimited AI parenting assistant',
      'Personalized insights from your tracked data',
      'Smart sleep & feeding pattern tips',
      'Vaccination & milestone reminders',
      'Export health reports',
    ] satisfies string[],
  },
  free: {
    id: 'free' as const,
    name: 'Free',
    features: [
      'Feeding, sleep & diaper tracking',
      'Growth charts & milestones',
      'Health & vaccination log',
      `${FREE_FEATURE_LIMIT} free logs per feature`,
    ] satisfies string[],
  },
} as const;

export function planPrice(period: BillingPeriod) {
  const { monthlyPrice, yearlyPrice, currency } = PLANS.plus;
  const fmt = (n: number) => (Number.isInteger(n) ? `${currency}${n}` : `${currency}${n.toFixed(2)}`);
  if (period === 'monthly') {
    return { amount: monthlyPrice, label: `${fmt(monthlyPrice)}/mo`, perMonth: undefined };
  }
  const perMonth = yearlyPrice / 12;
  return {
    amount: yearlyPrice,
    label: `${fmt(yearlyPrice)}/yr`,
    perMonth: `${fmt(perMonth)}/mo`,
    savings: Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100),
  };
}

export function paywallHeadline(
  reason: PaywallReason,
  babyName?: string,
  feature?: FeatureLimitKey,
  companionMode = false,
) {
  if (companionMode) {
    switch (reason) {
      case 'ai_limit':
      case 'feature_limit':
        return 'Free limit reached';
      case 'ai_tab':
        return 'Bebio Plus';
      default:
        return 'Bebio Plus';
    }
  }

  switch (reason) {
    case 'ai_limit':
      return 'Unlock unlimited AI';
    case 'feature_limit':
      if (feature) {
        return `Upgrade to add more ${FEATURE_LIMIT_LABELS[feature]}`;
      }
      return 'Upgrade to add more';
    case 'ai_tab':
      return babyName ? `Give ${babyName} smarter care` : 'Unlock smarter care';
    default:
      return 'Upgrade to Bebio Plus';
  }
}

export function paywallSubtitle(
  reason: PaywallReason,
  babyName?: string,
  feature?: FeatureLimitKey,
  companionMode = false,
) {
  if (companionMode) {
    switch (reason) {
      case 'ai_limit':
        return babyName
          ? `The free plan includes ${FREE_FEATURE_LIMIT} AI questions. Bebio Plus adds unlimited AI guidance for ${babyName}.`
          : `The free plan includes ${FREE_FEATURE_LIMIT} AI questions. Bebio Plus adds unlimited AI guidance.`;
      case 'feature_limit':
        if (feature) {
          return `The free plan includes ${FREE_FEATURE_LIMIT} ${FEATURE_LIMIT_LABELS[feature]}. Bebio Plus unlocks unlimited tracking and AI.`;
        }
        return `The free plan includes ${FREE_FEATURE_LIMIT} logs per feature. Bebio Plus unlocks unlimited tracking and AI.`;
      case 'ai_tab':
        return babyName
          ? `Unlimited AI guidance tailored to ${babyName}'s age and your daily logs.`
          : 'Unlimited AI guidance tailored to your baby and daily logs.';
      default:
        return 'Unlimited tracking, AI guidance, and premium insights for your account.';
    }
  }

  switch (reason) {
    case 'ai_limit':
      return babyName
        ? `Get personalized AI guidance for ${babyName}'s sleep, feeding, and development.`
        : 'Get personalized AI guidance for sleep, feeding, and development.';
    case 'feature_limit':
      if (feature) {
        return `Upgrade to Bebio Plus for unlimited ${FEATURE_LIMIT_LABELS[feature]} and full access to every feature.`;
      }
      return 'Upgrade to Bebio Plus for unlimited tracking, AI help, and more.';
    case 'ai_tab':
      return babyName
        ? `Unlimited AI guidance tailored to ${babyName}'s age and your daily logs.`
        : 'Unlimited AI guidance tailored to your baby and daily logs.';
    default:
      return 'Everything you need to track, understand, and support your baby — with unlimited AI help.';
  }
}

export function freeLimitHint(atLimit: boolean, companionMode: boolean): string {
  if (!atLimit) return '';
  return companionMode
    ? ' — delete one to add more'
    : ' — delete one or upgrade to add more';
}
