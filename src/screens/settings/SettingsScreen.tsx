import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useSettingsScreen } from "@/features/settings/hooks/useSettingsScreen";
import { signOut } from "@/services/supabase/authService";
import { colors, radius, spacing } from "@/theme/tokens";

export function SettingsScreen() {
  const {
    profile,
    cycleSettings,
    loading,
    updateProfile,
    updateCycleSettings,
    restorePurchases,
    deletingAccount,
    deleteAccount,
    restoring
  } = useSettingsScreen();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");

  if (loading || !cycleSettings) {
    return (
      <ScreenContainer contentContainerStyle={styles.content}>
        <AppText>Loading settings...</AppText>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
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

const styles = StyleSheet.create({
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
