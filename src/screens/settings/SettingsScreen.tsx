import { useMemo, useState } from "react";
import { StyleSheet, TextInput } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useSettingsScreen } from "@/features/settings/hooks/useSettingsScreen";
import { signOut } from "@/services/supabase/authService";
import { useThemeColors } from "@/theme/ThemeProvider";
import { radius, spacing, type ThemeColors } from "@/theme/tokens";

export function SettingsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    profile,
    cycleSettings,
    loading,
    updateProfile,
    updateCycleSettings,
    restorePurchases,
    openCustomerCenter,
    deletingAccount,
    deleteAccount,
    restoring,
    openingCustomerCenter
  } = useSettingsScreen();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");

  if (loading || !cycleSettings) {
    return (
      <ScreenContainer includeBottomInset={false} contentContainerStyle={styles.content}>
        <AppText>Loading settings...</AppText>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer includeBottomInset={false} contentContainerStyle={styles.content}>
      <AppText variant="title">Settings</AppText>

      <AppCard>
        <AppText variant="subtitle">Profile</AppText>
        <TextInput
          style={styles.input}
          value={displayName}
          placeholder="Display name"
          onChangeText={setDisplayName}
        />
        <AppButton
          label="Save profile"
          onPress={() =>
            void updateProfile({
              display_name: displayName
            })
          }
        />
      </AppCard>

      <AppCard>
        <AppText variant="subtitle">Cycle settings</AppText>
        <AppText variant="caption" muted>
          Last period date: {cycleSettings.last_period_date}
        </AppText>
        <AppText variant="caption" muted>
          Cycle length: {cycleSettings.cycle_length_days} days
        </AppText>
        <AppText variant="caption" muted>
          Period length: {cycleSettings.period_length_days} days
        </AppText>
        <AppButton
          label="Set defaults"
          variant="outline"
          onPress={() =>
            void updateCycleSettings({
              last_period_date: new Date().toISOString().slice(0, 10),
              cycle_length_days: 28,
              period_length_days: 5
            })
          }
        />
      </AppCard>

      <AppCard>
        <AppText variant="subtitle">Subscription</AppText>
        <AppText muted>Restore purchases and sync entitlement status.</AppText>
        <AppButton
          label={openingCustomerCenter ? "Opening..." : "Manage subscription"}
          variant="outline"
          onPress={() => void openCustomerCenter()}
        />
        <AppButton label={restoring ? "Restoring..." : "Restore purchases"} onPress={() => void restorePurchases()} />
      </AppCard>

      <AppCard>
        <AppText variant="subtitle">Account</AppText>
        <AppButton label="Sign out" variant="outline" onPress={() => void signOut()} />
        <AppButton label={deletingAccount ? "Deleting..." : "Delete account"} variant="ghost" onPress={() => void deleteAccount()} />
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
    input: {
      minHeight: 50,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md
    }
  });
