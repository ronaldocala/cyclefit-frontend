import { MaterialIcons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { CycleTrackingEditor } from "@/components/CycleTrackingEditor";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useCycleSetupScreen } from "@/features/onboarding/hooks/useCycleSetupScreen";
import { useOnboardingStore } from "@/store/onboardingStore";
import { useThemeColors } from "@/theme/ThemeProvider";
import { spacing, type ThemeColors } from "@/theme/tokens";
import { isValidIsoDate, toIsoDate } from "@/utils/date";

import type { OnboardingStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<OnboardingStackParamList, "CycleSetup">;

export function CycleSetupScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { completeOnboarding, loading, error } = useCycleSetupScreen();
  const lastPeriodDate = useOnboardingStore((state) => state.lastPeriodDate);
  const cycleLengthDays = useOnboardingStore((state) => state.cycleLengthDays);
  const periodLengthDays = useOnboardingStore((state) => state.periodLengthDays);
  const setDraft = useOnboardingStore((state) => state.setDraft);

  const hasValidDate = isValidIsoDate(lastPeriodDate);
  const hasValidLengths = periodLengthDays < cycleLengthDays;

  async function handleComplete(): Promise<void> {
    if (!hasValidDate || !hasValidLengths) {
      return;
    }

    await completeOnboarding({
      last_period_date: lastPeriodDate,
      cycle_length_days: cycleLengthDays,
      period_length_days: periodLengthDays
    });
  }

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={24} color={colors.primarySoft} />
        <AppText variant="overline" muted>
          STEP 3 OF 3
        </AppText>
      </Pressable>

      <View style={styles.header}>
        <AppText variant="h2">Add cycle details</AppText>
        <AppText variant="subtitle" muted>
          A rough estimate is enough. You can update these dates whenever your cycle changes.
        </AppText>
      </View>

      <AppCard style={styles.formCard}>
        <CycleTrackingEditor
          value={{ lastPeriodDate, cycleLengthDays, periodLengthDays }}
          onChange={(patch) => setDraft(patch)}
        />
      </AppCard>

      <AppCard style={styles.tipCard}>
        <View style={styles.tipRow}>
          <MaterialIcons name="favorite-border" size={18} color={colors.primarySoft} />
          <AppText variant="body" muted style={styles.tipText}>
            CycleFit uses this information to soften intensity around low-energy days and time harder sessions when recovery usually feels better.
          </AppText>
        </View>
      </AppCard>

      {!hasValidDate ? <AppText style={styles.error}>Use YYYY-MM-DD for the date.</AppText> : null}
      {!hasValidLengths ? <AppText style={styles.error}>Period length needs to be shorter than cycle length.</AppText> : null}
      {error ? <AppText style={styles.error}>{error}</AppText> : null}

      <AppButton
        label={loading ? "Finishing setup..." : "Finish onboarding"}
        onPress={() => void handleComplete()}
        rightSlot={<MaterialIcons name="arrow-forward" size={20} color={colors.onPrimary} />}
      />

      <AppButton
        label="Use recommended defaults"
        variant="ghost"
        onPress={() => {
          const today = new Date();
          setDraft({
            lastPeriodDate: toIsoDate(today),
            cycleLengthDays: 28,
            periodLengthDays: 5
          });
        }}
      />
    </ScreenContainer>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      paddingTop: spacing.md,
      gap: spacing.lg
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    header: {
      gap: spacing.sm
    },
    formCard: {
      gap: spacing.md,
      backgroundColor: colors.surfaceMuted
    },
    tipCard: {
      backgroundColor: colors.surface
    },
    tipRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.md
    },
    tipText: {
      flex: 1
    },
    error: {
      color: colors.error
    }
  });
