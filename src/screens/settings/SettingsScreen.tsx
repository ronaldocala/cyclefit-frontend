import { MaterialIcons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { LayoutAnimation, Platform, Pressable, StyleSheet, UIManager, View } from "react-native";

import type { EquipmentAccess, FitnessLevel, WeeklyTrainingDays, WorkoutTimePreference } from "@/api/types";
import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { CycleTrackingEditor, type CycleTrackingDraft } from "@/components/CycleTrackingEditor";
import { GymPreferencesForm } from "@/components/GymPreferencesForm";
import { ScreenContainer } from "@/components/ScreenContainer";
import { computeCycleSummary } from "@/features/cycle/cycleCalculator";
import { equipmentOptions, goalOptions } from "@/features/onboarding/preferenceOptions";
import { useSettingsScreen } from "@/features/settings/hooks/useSettingsScreen";
import { useThemeColors } from "@/theme/ThemeProvider";
import { radius, spacing, type ThemeColors } from "@/theme/tokens";
import { formatEuropeanDate, toIsoDate } from "@/utils/date";

import type { SettingsStackParamList } from "@/navigation/types";

const DEFAULT_WEEKLY_TRAINING_DAYS: WeeklyTrainingDays = "3-4";
const DEFAULT_EQUIPMENT_ACCESS: EquipmentAccess = "home_equipment";
const DEFAULT_WORKOUT_TIME: WorkoutTimePreference = "medium";
const settingsCycleLengthOptions = Array.from({ length: 46 }, (_, index) => 15 + index);
const settingsPeriodLengthOptions = Array.from({ length: 15 }, (_, index) => 1 + index);

function buildCalendarHistoryValue(
  settings:
    | {
        historical_last_period_date: string | null;
        historical_cycle_length_days: number | null;
        historical_period_length_days: number | null;
      }
    | null
    | undefined
): CycleTrackingDraft | null {
  if (
    !settings?.historical_last_period_date ||
    !settings.historical_cycle_length_days ||
    !settings.historical_period_length_days
  ) {
    return null;
  }

  return {
    lastPeriodDate: settings.historical_last_period_date,
    cycleLengthDays: settings.historical_cycle_length_days,
    periodLengthDays: settings.historical_period_length_days
  };
}

function formatSyncMessage(syncStatus: "synced" | "pending", lastSyncedAt: string | null): string {
  if (syncStatus === "pending") {
    return "Saved on this device. Sync resumes automatically when you're back online.";
  }

  if (!lastSyncedAt) {
    return "Saved locally and ready to sync.";
  }

  return `Synced ${new Date(lastSyncedAt).toLocaleString()}.`;
}

type Props = NativeStackScreenProps<SettingsStackParamList, "SettingsHome">;

export function SettingsScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    profile,
    onboardingPreferences,
    cycleState,
    cycleSettings,
    loading,
    saveTrainingPreferences,
    updateCycleSettings,
    savingCycleSettings
  } = useSettingsScreen();

  const [draftFitnessLevel, setDraftFitnessLevel] = useState<FitnessLevel>("beginner");
  const [draftGoal, setDraftGoal] = useState<string>(goalOptions[0]);
  const [draftWeeklyTrainingDays, setDraftWeeklyTrainingDays] = useState<WeeklyTrainingDays>(
    onboardingPreferences?.weekly_training_days ?? DEFAULT_WEEKLY_TRAINING_DAYS
  );
  const [draftWorkoutTime, setDraftWorkoutTime] = useState<WorkoutTimePreference>(
    onboardingPreferences?.available_workout_time ?? DEFAULT_WORKOUT_TIME
  );
  const [draftEquipmentAccess, setDraftEquipmentAccess] = useState<EquipmentAccess[]>(
    onboardingPreferences?.equipment_access?.length ? onboardingPreferences.equipment_access : [DEFAULT_EQUIPMENT_ACCESS]
  );
  const [isGymPreferencesOpen, setIsGymPreferencesOpen] = useState(false);
  const [cycleError, setCycleError] = useState<string | null>(null);
  const [draftLastPeriodDate, setDraftLastPeriodDate] = useState(cycleSettings?.last_period_date ?? toIsoDate(new Date()));
  const [draftCycleLengthDays, setDraftCycleLengthDays] = useState(cycleSettings?.cycle_length_days ?? 28);
  const [draftPeriodLengthDays, setDraftPeriodLengthDays] = useState(cycleSettings?.period_length_days ?? 5);
  const [calendarHistoryValue, setCalendarHistoryValue] = useState<CycleTrackingDraft | null>(null);
  const [futurePhaseStartDate, setFuturePhaseStartDate] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    const nextDate = cycleSettings?.last_period_date ?? toIsoDate(new Date());
    setDraftLastPeriodDate(nextDate);
    setDraftCycleLengthDays(cycleSettings?.cycle_length_days ?? 28);
    setDraftPeriodLengthDays(cycleSettings?.period_length_days ?? 5);
    setCalendarHistoryValue(buildCalendarHistoryValue(cycleSettings));
    setFuturePhaseStartDate(cycleSettings?.future_phase_start_date ?? null);
  }, [
    cycleSettings?.cycle_length_days,
    cycleSettings?.future_phase_start_date,
    cycleSettings?.historical_cycle_length_days,
    cycleSettings?.historical_last_period_date,
    cycleSettings?.historical_period_length_days,
    cycleSettings?.last_period_date,
    cycleSettings?.period_length_days
  ]);

  useEffect(() => {
    setDraftFitnessLevel(profile?.fitness_level ?? "beginner");
    setDraftGoal(profile?.goal ?? goalOptions[0]);
    setDraftWeeklyTrainingDays(onboardingPreferences?.weekly_training_days ?? DEFAULT_WEEKLY_TRAINING_DAYS);
    setDraftWorkoutTime(onboardingPreferences?.available_workout_time ?? DEFAULT_WORKOUT_TIME);
    setDraftEquipmentAccess(
      onboardingPreferences?.equipment_access?.length ? onboardingPreferences.equipment_access : [DEFAULT_EQUIPMENT_ACCESS]
    );
  }, [
    onboardingPreferences?.available_workout_time,
    onboardingPreferences?.equipment_access,
    onboardingPreferences?.weekly_training_days,
    profile?.fitness_level,
    profile?.goal
  ]);

  const summary = useMemo(() => {
    if (!cycleSettings) {
      return null;
    }

    return computeCycleSummary({
      ...cycleSettings,
      last_period_date: draftLastPeriodDate,
      cycle_length_days: draftCycleLengthDays,
      period_length_days: draftPeriodLengthDays
    });
  }, [cycleSettings, draftCycleLengthDays, draftLastPeriodDate, draftPeriodLengthDays]);
  const selectedEquipment = draftEquipmentAccess[0] ?? DEFAULT_EQUIPMENT_ACCESS;
  const selectedEquipmentLabel = equipmentOptions.find((option) => option.value === selectedEquipment)?.label ?? "Home equipment";
  const profileName = profile?.display_name?.trim() || "Your Profile";
  const profileInitials = profileName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "Y";

  async function persistTrainingPreferences(
    patch: Partial<{
      fitnessLevel: FitnessLevel;
      goal: string;
      weeklyTrainingDays: WeeklyTrainingDays;
      workoutTime: WorkoutTimePreference;
      equipmentAccess: EquipmentAccess[];
    }>
  ): Promise<void> {
    const nextFitnessLevel = patch.fitnessLevel ?? draftFitnessLevel;
    const nextGoal = patch.goal ?? draftGoal;
    const nextWeeklyTrainingDays = patch.weeklyTrainingDays ?? draftWeeklyTrainingDays;
    const nextWorkoutTime = patch.workoutTime ?? draftWorkoutTime;
    const nextEquipmentAccess = patch.equipmentAccess ?? draftEquipmentAccess;

    if (patch.fitnessLevel) {
      setDraftFitnessLevel(patch.fitnessLevel);
    }

    if (patch.goal) {
      setDraftGoal(patch.goal);
    }

    if (patch.weeklyTrainingDays) {
      setDraftWeeklyTrainingDays(patch.weeklyTrainingDays);
    }

    if (patch.workoutTime) {
      setDraftWorkoutTime(patch.workoutTime);
    }

    if (patch.equipmentAccess) {
      setDraftEquipmentAccess(patch.equipmentAccess);
    }

    await saveTrainingPreferences({
      profile: {
        fitness_level: nextFitnessLevel,
        goal: nextGoal
      },
      onboarding: {
        weekly_training_days: nextWeeklyTrainingDays,
        riding_environment: onboardingPreferences?.riding_environment ?? "mixed",
        equipment_access: [nextEquipmentAccess[0] ?? DEFAULT_EQUIPMENT_ACCESS],
        available_workout_time: nextWorkoutTime
      }
    });
  }

  async function handleCycleSave(): Promise<void> {
    const nextCycleLength = draftCycleLengthDays;
    const nextPeriodLength = draftPeriodLengthDays;

    if (nextCycleLength < 15 || nextCycleLength > 60) {
      setCycleError("Cycle length needs to be between 15 and 60 days.");
      return;
    }

    if (nextPeriodLength < 1 || nextPeriodLength > 15) {
      setCycleError("Period length needs to be between 1 and 15 days.");
      return;
    }

    if (nextPeriodLength >= nextCycleLength) {
      setCycleError("Period length needs to be shorter than the full cycle length.");
      return;
    }

    setCycleError(null);
    await updateCycleSettings({
      last_period_date: draftLastPeriodDate,
      cycle_length_days: nextCycleLength,
      period_length_days: nextPeriodLength,
      historical_last_period_date: calendarHistoryValue?.lastPeriodDate ?? null,
      historical_cycle_length_days: calendarHistoryValue?.cycleLengthDays ?? null,
      historical_period_length_days: calendarHistoryValue?.periodLengthDays ?? null,
      future_phase_start_date: futurePhaseStartDate
    });
  }

  function handleTrackPeriodToday(): void {
    const todayIso = toIsoDate(new Date());

    if (draftLastPeriodDate === todayIso && (futurePhaseStartDate === null || futurePhaseStartDate === todayIso)) {
      return;
    }

    setCalendarHistoryValue({
      lastPeriodDate: draftLastPeriodDate,
      cycleLengthDays: draftCycleLengthDays,
      periodLengthDays: draftPeriodLengthDays
    });
    setFuturePhaseStartDate(todayIso);
    setDraftLastPeriodDate(todayIso);

    if (cycleError) {
      setCycleError(null);
    }
  }

  function toggleGymPreferences(): void {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsGymPreferencesOpen((current) => !current);
  }

  if (loading) {
    return (
      <ScreenContainer includeBottomInset={false} contentContainerStyle={styles.content}>
        <AppText>Loading settings...</AppText>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer includeBottomInset={false} contentContainerStyle={styles.content}>
      <AppText variant="title">Settings</AppText>

      <AppCard style={styles.profileCard}>
        <Pressable style={styles.profileTile} onPress={() => navigation.navigate("ProfileSettings")}>
          <View style={styles.profileBadge}>
            <AppText variant="subtitle" style={styles.profileBadgeText}>
              {profileInitials}
            </AppText>
          </View>
          <View style={styles.profileTileText}>
            <AppText variant="subtitle">{profileName}</AppText>
            <AppText variant="caption" muted>
              Account settings
            </AppText>
          </View>
          <View style={styles.profileTileAction}>
            <MaterialIcons name="arrow-forward" size={18} color={colors.primary} />
          </View>
        </Pressable>
      </AppCard>

      <AppCard style={styles.cycleOverviewCard}>
        <View style={styles.cycleOverviewHeader}>
          <View style={styles.cycleOverviewText}>
            <AppText variant="subtitle">Cycle Tracking</AppText>
            <AppText variant="caption" muted>
              {formatSyncMessage(cycleState.syncStatus, cycleState.lastSyncedAt)}
            </AppText>
          </View>
          {summary ? (
            <View style={styles.phaseBadge}>
              <AppText variant="caption" style={styles.phaseBadgeText}>
                {summary.phaseLabel}
              </AppText>
            </View>
          ) : null}
        </View>

        {!summary ? (
          <AppText muted>Add your cycle details to personalize training and recovery across the app.</AppText>
        ) : null}

        <CycleTrackingEditor
          value={{
            lastPeriodDate: draftLastPeriodDate,
            cycleLengthDays: draftCycleLengthDays,
            periodLengthDays: draftPeriodLengthDays
          }}
          historyValue={calendarHistoryValue}
          futurePhaseStartDate={futurePhaseStartDate}
          onTrackPeriodToday={handleTrackPeriodToday}
          onChange={(patch) => {
            if (patch.lastPeriodDate !== undefined) {
              setDraftLastPeriodDate(patch.lastPeriodDate);
              setCalendarHistoryValue(null);
              setFuturePhaseStartDate(null);
            }

            if (patch.cycleLengthDays !== undefined) {
              setDraftCycleLengthDays(patch.cycleLengthDays);
            }

            if (patch.periodLengthDays !== undefined) {
              setDraftPeriodLengthDays(patch.periodLengthDays);
            }

            if (cycleError) {
              setCycleError(null);
            }
          }}
          showForecast
          cycleLengthOptions={settingsCycleLengthOptions}
          periodLengthOptions={settingsPeriodLengthOptions}
        />

        {summary ? (
          <View style={styles.inlineMetaRow}>
            <AppText variant="caption" muted>
              Day {summary.dayInCycle}
            </AppText>
            <AppText variant="caption" muted>
              Next period {formatEuropeanDate(summary.nextPeriodDate)}
            </AppText>
          </View>
        ) : null}

        {cycleError ? <AppText style={styles.error}>{cycleError}</AppText> : null}

        <AppButton label={savingCycleSettings ? "Saving..." : "Save cycle"} onPress={() => void handleCycleSave()} />
      </AppCard>

      <AppCard style={styles.card}>
        <Pressable style={styles.sectionToggle} onPress={toggleGymPreferences}>
          <View style={styles.sectionToggleText}>
            <AppText variant="subtitle">Gym Preferences</AppText>
            <AppText variant="caption" muted>
              {draftGoal} | {draftWeeklyTrainingDays} days/week | {selectedEquipmentLabel}
            </AppText>
          </View>
          <View style={styles.sectionToggleAction}>
            <MaterialIcons
              name={isGymPreferencesOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"}
              size={22}
              color={colors.primary}
            />
          </View>
        </Pressable>

        {isGymPreferencesOpen ? (
          <GymPreferencesForm
            value={{
              fitnessLevel: draftFitnessLevel,
              goal: draftGoal,
              weeklyTrainingDays: draftWeeklyTrainingDays,
              availableWorkoutTime: draftWorkoutTime,
              equipmentAccess: draftEquipmentAccess
            }}
            onChange={(patch) => {
              void persistTrainingPreferences({
                fitnessLevel: patch.fitnessLevel,
                goal: patch.goal,
                weeklyTrainingDays: patch.weeklyTrainingDays,
                workoutTime: patch.availableWorkoutTime,
                equipmentAccess: patch.equipmentAccess
              });
            }}
          />
        ) : null}
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
    card: {
      gap: spacing.md
    },
    profileCard: {
      padding: spacing.sm
    },
    profileTile: {
      minHeight: 84,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md
    },
    profileBadge: {
      width: 52,
      height: 52,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center"
    },
    profileBadgeText: {
      color: colors.onPrimary
    },
    profileTileText: {
      flex: 1,
      gap: spacing.xs
    },
    profileTileAction: {
      width: 34,
      height: 34,
      borderRadius: radius.full,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center"
    },
    cycleOverviewCard: {
      gap: spacing.md,
      backgroundColor: colors.surface
    },
    cycleOverviewHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: spacing.sm
    },
    cycleOverviewText: {
      flex: 1,
      gap: spacing.xs
    },
    phaseBadge: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm
    },
    phaseBadgeText: {
      color: colors.primary
    },
    inlineMetaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    sectionToggle: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.md
    },
    sectionToggleText: {
      flex: 1,
      gap: spacing.xs
    },
    sectionToggleAction: {
      width: 28,
      height: 28,
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceMuted
    },
    error: {
      color: colors.error
    }
  });

