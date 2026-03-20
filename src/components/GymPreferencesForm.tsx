import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { EquipmentAccess, FitnessLevel, WeeklyTrainingDays, WorkoutTimePreference } from "@/api/types";
import { AppText } from "@/components/AppText";
import {
  availabilityOptions,
  equipmentOptions,
  experienceOptions,
  goalOptions,
  workoutTimeOptions
} from "@/features/onboarding/preferenceOptions";
import { useThemeColors } from "@/theme/ThemeProvider";
import { radius, spacing, type ThemeColors } from "@/theme/tokens";

export type GymPreferencesValue = {
  fitnessLevel: FitnessLevel;
  goal: string;
  weeklyTrainingDays: WeeklyTrainingDays;
  availableWorkoutTime: WorkoutTimePreference;
  equipmentAccess: EquipmentAccess[];
};

type GymPreferencesFormProps = {
  value: GymPreferencesValue;
  onChange: (patch: Partial<GymPreferencesValue>) => void;
};

export function GymPreferencesForm({ value, onChange }: GymPreferencesFormProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const selectedEquipment = value.equipmentAccess[0] ?? null;

  return (
    <>
      <View style={styles.fieldBlock}>
        <AppText variant="overline" muted>
          EXPERIENCE LEVEL
        </AppText>
        <View style={styles.stack}>
          {experienceOptions.map((option) => {
            const isActive = value.fitnessLevel === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={() => onChange({ fitnessLevel: option.value })}
                style={[styles.optionCard, isActive ? styles.optionCardActive : undefined]}
              >
                <AppText variant="bodyStrong" style={isActive ? styles.optionTextActive : undefined}>
                  {option.label}
                </AppText>
                <AppText variant="caption" muted={!isActive} style={isActive ? styles.optionBodyActive : undefined}>
                  {option.description}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.fieldBlock}>
        <AppText variant="overline" muted>
          MAIN FOCUS
        </AppText>
        <View style={styles.chipRow}>
          {goalOptions.map((option) => {
            const isActive = value.goal === option;

            return (
              <Pressable
                key={option}
                onPress={() => onChange({ goal: option })}
                style={[styles.chip, isActive ? styles.chipActive : undefined]}
              >
                <AppText variant="caption" style={isActive ? styles.chipActiveText : undefined}>
                  {option}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.fieldBlock}>
        <AppText variant="overline" muted>
          DAYS / WEEK
        </AppText>
        <View style={styles.chipRow}>
          {availabilityOptions.map((option) => {
            const isActive = value.weeklyTrainingDays === option;

            return (
              <Pressable
                key={option}
                onPress={() => onChange({ weeklyTrainingDays: option })}
                style={[styles.chip, styles.smallChip, isActive ? styles.chipActive : undefined]}
              >
                <AppText variant="caption" style={isActive ? styles.chipActiveText : undefined}>
                  {option}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.fieldBlock}>
        <AppText variant="overline" muted>
          AVAILABLE TIME
        </AppText>
        <View style={styles.stack}>
          {workoutTimeOptions.map((option) => {
            const isActive = value.availableWorkoutTime === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={() => onChange({ availableWorkoutTime: option.value })}
                style={[styles.optionCard, isActive ? styles.optionCardActive : undefined]}
              >
                <AppText variant="bodyStrong" style={isActive ? styles.optionTextActive : undefined}>
                  {option.label}
                </AppText>
                <AppText variant="caption" muted={!isActive} style={isActive ? styles.optionBodyActive : undefined}>
                  {option.description}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.fieldBlock}>
        <AppText variant="overline" muted>
          WHAT EQUIPMENT DO YOU HAVE ACCESS TO?
        </AppText>
        <View style={styles.chipRow}>
          {equipmentOptions.map((option) => {
            const isActive = selectedEquipment === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={() => onChange({ equipmentAccess: [option.value] })}
                style={[styles.chip, isActive ? styles.chipActive : undefined]}
              >
                <AppText variant="caption" style={isActive ? styles.chipActiveText : undefined}>
                  {option.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    fieldBlock: {
      gap: spacing.sm
    },
    stack: {
      gap: spacing.sm
    },
    optionCard: {
      gap: spacing.xs,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
      padding: spacing.lg
    },
    optionCardActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary
    },
    optionTextActive: {
      color: colors.surface
    },
    optionBodyActive: {
      color: colors.surface
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    chip: {
      minHeight: 40,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.md
    },
    smallChip: {
      minWidth: 78
    },
    chipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.sage
    },
    chipActiveText: {
      color: colors.primary
    }
  });
