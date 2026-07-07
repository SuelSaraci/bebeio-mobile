import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../lib/firebase";
import { useApp } from "../context/AppContext";
import { useSubscription } from "../context/SubscriptionContext";
import { useToast } from "../components/Toast";
import { api } from "../lib/api";
import { colors } from "../theme/colors";

export function UserDetailsScreen() {
  const { profile, baby, logout } = useApp();
  const { isPremium, refreshSubscriptionState } = useSubscription();
  const { showError, showSuccess } = useToast();
  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const userEmail = auth.currentUser?.email || "Not available";
  const userName = profile?.name?.trim() || "Not set";
  const babyName = baby?.name?.trim() || "Not set";

  const subscriptionLabel = useMemo(
    () => (isPremium ? "Bebio Plus (Active)" : "Free plan"),
    [isPremium],
  );

  const handleCancelSubscription = () => {
    if (!isPremium) {
      showError("No active premium subscription found.");
      return;
    }

    Alert.alert(
      "Cancel active subscription?",
      "This will end your premium access at the end of the current billing period.",
      [
        { text: "Keep subscription", style: "cancel" },
        {
          text: "Cancel subscription",
          style: "destructive",
          onPress: async () => {
            setCancelingSubscription(true);
            try {
              const result = await api.cancelSubscription();
              await refreshSubscriptionState();
              showSuccess(
                result.message || "Subscription cancellation requested successfully.",
              );
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : "Failed to cancel subscription.";
              showError(message);
            } finally {
              setCancelingSubscription(false);
            }
          },
        },
      ],
    );
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to log out.";
      showError(message);
      setLoggingOut(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>User details</Text>

      <View style={styles.card}>
        <DetailRow label="Name" value={userName} />
        <DetailRow label="Email" value={userEmail} />
        <DetailRow label="Baby name" value={babyName} />
        <DetailRow label="Plan" value={subscriptionLabel} />
      </View>

      <TouchableOpacity
        style={[
          styles.actionButton,
          styles.cancelButton,
          (!isPremium || cancelingSubscription) && styles.disabled,
        ]}
        onPress={handleCancelSubscription}
        disabled={!isPremium || cancelingSubscription}
        activeOpacity={0.8}
      >
        {cancelingSubscription ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.actionText}>
            {isPremium ? "Cancel active subscription" : "No active subscription"}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.logoutButton, loggingOut && styles.disabled]}
        onPress={handleLogout}
        disabled={loggingOut}
        activeOpacity={0.8}
      >
        {loggingOut ? (
          <ActivityIndicator color={colors.foreground} />
        ) : (
          <Text style={styles.logoutText}>Log out</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.foreground,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  row: {
    gap: 4,
  },
  label: {
    fontSize: 11,
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    fontWeight: "700",
  },
  value: {
    fontSize: 15,
    color: colors.foreground,
    fontWeight: "600",
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: colors.red500,
  },
  logoutButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  logoutText: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.6,
  },
});
