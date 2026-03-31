import { MaterialIcons } from "@expo/vector-icons";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { ScreenContainer } from "@/components/ScreenContainer";
import { experienceOptions, workoutTimeOptions } from "@/features/onboarding/preferenceOptions";
import { useWorkoutsScreen, type WorkoutBrowseFilters } from "@/features/workouts/hooks/useWorkoutsScreen";
import { useThemeColors } from "@/theme/ThemeProvider";
import { radius, spacing, type ThemeColors } from "@/theme/tokens";

import type { MainTabParamList, RootStackParamList } from "@/navigation/types";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Workouts">,
  NativeStackScreenProps<RootStackParamList>
>;

type FilterMenuId = keyof WorkoutBrowseFilters | null;
type FilterOption<T extends string> = {
  label: string;
  value: T;
};

const experienceFilterOptions: FilterOption<WorkoutBrowseFilters["experience"]>[] = experienceOptions.map((option) => ({
  label: option.label,
  value: option.value
}));

const environmentOptions: FilterOption<WorkoutBrowseFilters["environment"]>[] = [
  { label: "All", value: "all" },
  { label: "Home", value: "home" },
  { label: "Gym", value: "gym" }
];

const phaseOptions: FilterOption<WorkoutBrowseFilters["phase"]>[] = [
  { label: "All phases", value: "all" },
  { label: "Menstrual", value: "menstrual" },
  { label: "Follicular", value: "follicular" },
  { label: "Ovulation", value: "ovulation" },
  { label: "Luteal", value: "luteal" }
];

const lengthOptions: FilterOption<WorkoutBrowseFilters["length"]>[] = [
  { label: "All", value: "all" },
  ...workoutTimeOptions.map((option) => ({
    label: option.label,
    value: option.value
  }))
];

const lengthModalOptions: FilterOption<WorkoutBrowseFilters["length"]>[] = [
  { label: "All", value: "all" },
  ...workoutTimeOptions.map((option) => ({
    label: `${option.label} (${option.description.replace("Usually ", "").replace(".", "")})`,
    value: option.value
  }))
];

const intensityOptions: FilterOption<WorkoutBrowseFilters["intensity"]>[] = [
  { label: "All", value: "all" },
  { label: "Low", value: "low" },
  { label: "Moderate", value: "moderate" },
  { label: "High", value: "high" }
];

const menuLabels: Record<Exclude<FilterMenuId, null>, string> = {
  phase: "Menstrual Phase",
  experience: "Experience Level",
  environment: "Equipment",
  length: "Available Time",
  intensity: "Intensity"
};

function getPhaseLabel(value: WorkoutBrowseFilters["phase"]): string {
  return getOptionLabel(phaseOptions, value);
}

function getFilterChipValue<K extends Exclude<FilterMenuId, null>>(menu: K, filters: WorkoutBrowseFilters): string {
  if (menu === "phase") {
    return filters.phase === "all" ? "All phases" : getPhaseLabel(filters.phase);
  }

  if (menu === "experience") {
    return getOptionLabel(experienceFilterOptions, filters.experience);
  }

  if (menu === "environment") {
    return filters.environment === "all" ? "Any equipment" : getOptionLabel(environmentOptions, filters.environment);
  }

  if (menu === "length") {
    return filters.length === "all" ? "Any time" : getOptionLabel(lengthOptions, filters.length);
  }

  return filters.intensity === "all" ? "Any intensity" : getOptionLabel(intensityOptions, filters.intensity);
}

function getFilterSummaryItems(filters: WorkoutBrowseFilters) {
  return [
    { menu: "phase" as const, value: getFilterChipValue("phase", filters) },
    { menu: "experience" as const, value: getFilterChipValue("experience", filters) },
    { menu: "environment" as const, value: getFilterChipValue("environment", filters) },
    { menu: "length" as const, value: getFilterChipValue("length", filters) },
    { menu: "intensity" as const, value: getFilterChipValue("intensity", filters) }
  ];
}

function getOptionLabel<T extends string>(options: FilterOption<T>[], value: T): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function WorkoutsScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    isPremium,
    filters,
    currentPhase,
    profileExperience,
    preferredWorkoutLength,
    userWorkouts,
    premiumWorkouts,
    filteredReferenceWorkouts,
    updateFilters,
    resetFilters,
    loading
  } = useWorkoutsScreen();
  const [activeMenu, setActiveMenu] = useState<FilterMenuId>(null);

  const activeOptions = useMemo(() => {
    if (!activeMenu) {
      return [];
    }

    if (activeMenu === "phase") {
      return phaseOptions;
    }

    if (activeMenu === "experience") {
      return experienceFilterOptions;
    }

    if (activeMenu === "environment") {
      return environmentOptions;
    }

    if (activeMenu === "length") {
      return lengthModalOptions;
    }

    return intensityOptions;
  }, [activeMenu]);

  const activeValue = activeMenu && filters ? filters[activeMenu] : null;

  function openQuickFilter(menu: Exclude<FilterMenuId, null>) {
    setActiveMenu(menu);
  }

  function closeFilterOptions() {
    setActiveMenu(null);
  }

  if (loading || !filters) {
    return (
      <ScreenContainer includeBottomInset={false} contentContainerStyle={styles.content}>
        <AppText>Loading workouts...</AppText>
      </ScreenContainer>
    );
  }

  const hasCustomFilters =
    filters.phase !== currentPhase ||
    filters.experience !== profileExperience ||
    filters.environment !== "all" ||
    filters.length !== preferredWorkoutLength ||
    filters.intensity !== "all";

  return (
    <>
      <ScreenContainer includeBottomInset={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <AppText variant="title">Workouts</AppText>
          <AppText variant="caption" muted>
            {isPremium ? "Premium access active" : "Free access"}
          </AppText>
        </View>

        <AppCard style={styles.libraryCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderText}>
              <AppText variant="subtitle">Cycle workout library</AppText>
              <AppText variant="caption" muted>
                Starts from {getPhaseLabel(currentPhase)} phase, {getOptionLabel(experienceFilterOptions, profileExperience)} level, and{" "}
                {getOptionLabel(lengthOptions, preferredWorkoutLength)} time by default.
              </AppText>
            </View>
            <View style={styles.headerRight}>
              <View style={styles.resultsBadge}>
                <AppText variant="caption" style={styles.resultsBadgeText}>
                  {filteredReferenceWorkouts.length} results
                </AppText>
              </View>
            </View>
          </View>

          <View style={styles.filterSummaryList}>
            {getFilterSummaryItems(filters).map((item) => (
              <Pressable key={item.menu} style={styles.filterSummaryChip} onPress={() => openQuickFilter(item.menu)}>
                <AppText variant="caption" style={styles.filterSummaryValue}>
                  {item.value}
                </AppText>
                <MaterialIcons name="arrow-drop-down" size={16} color={colors.textSecondary} />
              </Pressable>
            ))}
            {hasCustomFilters ? (
              <Pressable style={styles.resetChip} onPress={resetFilters}>
                <MaterialIcons name="restart-alt" size={14} color={colors.primary} />
                <AppText variant="caption" style={styles.resetChipText}>
                  Reset
                </AppText>
              </Pressable>
            ) : null}
          </View>
        </AppCard>

        <AppCard>
          <AppText variant="subtitle">Guided workouts</AppText>
          {filteredReferenceWorkouts.length ? (
            filteredReferenceWorkouts.map((workout, index) => (
              <Pressable
                key={workout.id}
                style={[styles.workoutRow, index === filteredReferenceWorkouts.length - 1 ? styles.workoutRowLast : undefined]}
                onPress={() =>
                  navigation.navigate("WorkoutSession", {
                    sourceType: "premium_workout",
                    sourceId: workout.id
                  })
                }
              >
                <View style={styles.workoutRowText}>
                  <AppText variant="bodyStrong">{workout.name}</AppText>
                  <AppText variant="caption" muted>
                    {workout.estDurationMinutes} mins • {getOptionLabel(environmentOptions, workout.environment)} • {workout.category[0].toUpperCase() + workout.category.slice(1)}
                  </AppText>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
              </Pressable>
            ))
          ) : (
            <AppText muted>No workouts match those filters.</AppText>
          )}
        </AppCard>

        <AppCard>
          <AppText variant="subtitle">Workout Builder</AppText>
          <AppText muted>Create and log your own workouts, available for all users.</AppText>
          <AppButton
            label="Start quick session"
            onPress={() => navigation.navigate("WorkoutSession", { sourceType: "quick_log" })}
          />
        </AppCard>

        {isPremium ? (
          <AppCard>
            <AppText variant="subtitle">Premium plans</AppText>
            {premiumWorkouts.length ? (
              premiumWorkouts.slice(0, 6).map((workout, index) => (
                <Pressable
                  key={workout.id}
                  style={[styles.workoutRow, index === premiumWorkouts.slice(0, 6).length - 1 ? styles.workoutRowLast : undefined]}
                  onPress={() =>
                    navigation.navigate("WorkoutSession", {
                      sourceType: "premium_workout",
                      sourceId: workout.id
                    })
                  }
                >
                  <View style={styles.workoutRowText}>
                    <AppText variant="bodyStrong">{workout.name}</AppText>
                    <AppText variant="caption" muted>
                      {workout.est_duration_minutes ?? 30} mins
                    </AppText>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
                </Pressable>
              ))
            ) : (
              <AppText muted>No premium workouts published yet.</AppText>
            )}
          </AppCard>
        ) : (
          <AppCard style={styles.softCard}>
            <AppText variant="subtitle">Premium plans</AppText>
            <AppText muted>Upgrade to unlock guided week plans and premium sessions.</AppText>
            <AppButton label="See Premium" variant="secondary" onPress={() => navigation.navigate("PremiumUpsell")} />
          </AppCard>
        )}

        <AppCard>
          <AppText variant="subtitle">History</AppText>
          {userWorkouts.length ? (
            userWorkouts.slice(0, 5).map((workout, index) => (
              <Pressable
                key={workout.id}
                style={[styles.workoutRow, index === Math.min(userWorkouts.length, 5) - 1 ? styles.workoutRowLast : undefined]}
                onPress={() =>
                  navigation.navigate("WorkoutSession", {
                    sourceType: "user_workout",
                    sourceId: workout.id
                  })
                }
              >
                <View style={styles.workoutRowText}>
                  <AppText variant="bodyStrong">{workout.name}</AppText>
                  <AppText variant="caption" muted>
                    Updated {new Date(workout.updated_at).toDateString()}
                  </AppText>
                </View>
                <MaterialIcons name="play-circle-outline" size={20} color={colors.primary} />
              </Pressable>
            ))
          ) : (
            <AppText muted>No saved workouts yet.</AppText>
          )}
        </AppCard>
      </ScreenContainer>

      <Modal visible={activeMenu !== null} transparent animationType="fade" onRequestClose={closeFilterOptions}>
        <Pressable style={styles.modalBackdrop} onPress={closeFilterOptions}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHeader}>
              <AppText variant="subtitle">{activeMenu ? menuLabels[activeMenu] : "Filter"}</AppText>
              <Pressable style={styles.closeButton} onPress={closeFilterOptions}>
                <MaterialIcons name="close" size={18} color={colors.primary} />
              </Pressable>
            </View>

            {activeOptions.map((option) => {
              const selected = option.value === activeValue;

              return (
                <Pressable
                  key={option.value}
                  style={[styles.optionRow, selected ? styles.optionRowSelected : undefined]}
                  onPress={() => {
                    if (!activeMenu) {
                      return;
                    }

                    updateFilters({ [activeMenu]: option.value } as Partial<WorkoutBrowseFilters>);
                    closeFilterOptions();
                  }}
                >
                  <AppText variant="bodyStrong" style={selected ? styles.optionRowSelectedText : undefined}>
                    {option.label}
                  </AppText>
                  {selected ? <MaterialIcons name="check" size={18} color={colors.onPrimary} /> : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      gap: spacing.lg,
      paddingTop: spacing.md
    },
    header: {
      gap: 4
    },
    cardHeaderRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.md
    },
    headerRight: {
      alignItems: "flex-end",
      gap: spacing.xs
    },
    cardHeaderText: {
      flex: 1,
      gap: 2
    },
    libraryCard: {
      paddingTop: spacing.md,
      paddingBottom: spacing.md
    },
    resultsBadge: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4
    },
    resultsBadgeText: {
      color: colors.primary
    },
    filterSummaryList: {
      marginTop: spacing.sm,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    filterSummaryChip: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 6,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      minHeight: 32
    },
    filterSummaryValue: {
      color: colors.primary,
      flexShrink: 1
    },
    resetChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      minHeight: 32
    },
    resetChipText: {
      color: colors.primary
    },
    workoutRow: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md
    },
    workoutRowLast: {
      borderBottomWidth: 0,
      paddingBottom: 0
    },
    workoutRowText: {
      flex: 1,
      gap: 6
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6
    },
    metaChip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: 8,
      paddingVertical: 3
    },
    softCard: {
      backgroundColor: colors.surfaceMuted
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "center",
      padding: spacing.xl
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.sm
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.xs
    },
    closeButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted
    },
    optionRow: {
      minHeight: 48,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    optionRowSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary
    },
    optionRowSelectedText: {
      color: colors.onPrimary
    }
  });
