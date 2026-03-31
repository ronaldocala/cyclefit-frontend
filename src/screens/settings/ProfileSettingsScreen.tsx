import { MaterialIcons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useSettingsScreen } from "@/features/settings/hooks/useSettingsScreen";
import type { PremiumState } from "@/services/premium/premiumAccessService";
import { signOut } from "@/services/supabase/authService";
import { useAppStore } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";
import { useThemeColors } from "@/theme/ThemeProvider";
import { radius, spacing, type ThemeColors } from "@/theme/tokens";
import { useDemoMode } from "@/utils/demoMode";

import type { SettingsStackParamList } from "@/navigation/types";

const TERMS_AND_CONDITIONS_URL = "https://example.com/terms";
const PRIVACY_POLICY_URL = "https://example.com/privacy";

type Props = NativeStackScreenProps<SettingsStackParamList, "ProfileSettings">;

function formatSubscriptionDetails(isPremium: boolean, premiumState: PremiumState): { label: string; detail: string } {
  if (isPremium) {
    return {
      label: "CycleFit Pro",
      detail: "Premium access is active."
    };
  }

  switch (premiumState) {
    case "loading":
      return {
        label: "Checking",
        detail: "Verifying your entitlement."
      };
    case "expired":
      return {
        label: "Free",
        detail: "No active premium subscription."
      };
    case "error":
      return {
        label: "Unavailable",
        detail: "Subscription status could not be verified."
      };
    default:
      return {
        label: "Free",
        detail: "Premium purchases are temporarily unavailable."
      };
  }
}

type DetailRowProps = {
  label: string;
  value: string;
  detail?: string;
};

function DetailRow({ label, value, detail }: DetailRowProps) {
  return (
    <View style={stylesStatic.detailRow}>
      <AppText variant="caption" muted>
        {label}
      </AppText>
      <AppText variant="bodyStrong">{value}</AppText>
      {detail ? (
        <AppText variant="caption" muted>
          {detail}
        </AppText>
      ) : null}
    </View>
  );
}

type LinkRowProps = {
  label: string;
  onPress: () => void;
};

function LinkRow({ label, onPress }: LinkRowProps) {
  return (
    <Pressable style={stylesStatic.linkRow} onPress={onPress}>
      <AppText variant="bodyStrong">{label}</AppText>
      <AppText variant="bodyStrong" style={stylesStatic.linkRowAction}>
        Open
      </AppText>
    </Pressable>
  );
}

export function ProfileSettingsScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isDemoMode = useDemoMode();
  const session = useAuthStore((state) => state.session);
  const isPremium = useAppStore((state) => state.isPremium);
  const premiumState = useAppStore((state) => state.premiumState);
  const { profile, loading, deletingAccount, deleteAccount } = useSettingsScreen();

  const sessionEmail = session?.user.email ?? null;
  const username = profile?.display_name?.trim() || sessionEmail?.split("@")[0] || "Not set";
  const email = sessionEmail ?? (isDemoMode ? "demo@cyclefit.app" : "Not available");
  const subscription = formatSubscriptionDetails(isPremium || isDemoMode, isDemoMode ? "active" : premiumState);

  async function openExternalLink(url: string): Promise<void> {
    await Linking.openURL(url);
  }

  if (loading) {
    return (
      <ScreenContainer includeBottomInset={false} contentContainerStyle={styles.content}>
        <AppText>Loading profile settings...</AppText>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer includeBottomInset={false} contentContainerStyle={styles.content}>
      <Pressable style={styles.backRow} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={20} color={colors.primarySoft} />
        <AppText variant="bodyStrong">Back to settings</AppText>
      </Pressable>

      <View style={styles.header}>
        <AppText variant="title">Profile Settings</AppText>
        <AppText muted>Manage your account, subscription access, and legal documents.</AppText>
      </View>

      <AppCard style={styles.card}>
        <View style={styles.detailGroup}>
          <DetailRow label="Username" value={username} />
          <DetailRow label="Email" value={email} />
          <DetailRow label="Subscription" value={subscription.label} detail={subscription.detail} />
        </View>
        <View style={styles.sectionDivider} />
        <View style={styles.actionGroup}>
          <AppButton label="Sign out" variant="outline" onPress={() => void signOut()} />
          <Pressable style={styles.destructiveButton} onPress={() => void deleteAccount()}>
            <AppText variant="bodyStrong" style={styles.destructiveButtonText}>
              {deletingAccount ? "Deleting..." : "Delete account"}
            </AppText>
          </Pressable>
        </View>
        <View style={styles.sectionDivider} />
        <View style={styles.linkGroup}>
          <LinkRow label="Terms & Conditions" onPress={() => void openExternalLink(TERMS_AND_CONDITIONS_URL)} />
          <LinkRow label="Privacy Policy" onPress={() => void openExternalLink(PRIVACY_POLICY_URL)} />
        </View>
      </AppCard>
    </ScreenContainer>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      paddingTop: spacing.md,
      gap: spacing.lg
    },
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      alignSelf: "flex-start"
    },
    header: {
      gap: spacing.xs
    },
    card: {
      gap: spacing.md
    },
    detailGroup: {
      gap: spacing.sm
    },
    sectionDivider: {
      height: 1,
      backgroundColor: colors.border
    },
    actionGroup: {
      gap: spacing.sm
    },
    linkGroup: {
      gap: spacing.xs
    },
    destructiveButton: {
      minHeight: 52,
      borderWidth: 1,
      borderColor: colors.error,
      borderRadius: radius.lg,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.xl
    },
    destructiveButtonText: {
      color: colors.error
    }
  });

const stylesStatic = StyleSheet.create({
  detailRow: {
    gap: spacing.xs
  },
  linkRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  linkRowAction: {
    opacity: 0.7
  }
});
