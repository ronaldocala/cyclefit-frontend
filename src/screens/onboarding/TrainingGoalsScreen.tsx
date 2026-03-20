import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { GymPreferencesForm } from "@/components/GymPreferencesForm";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useOnboardingStore } from "@/store/onboardingStore";
import { useThemeColors } from "@/theme/ThemeProvider";
import { radius, spacing, type ThemeColors } from "@/theme/tokens";

import type { OnboardingStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<OnboardingStackParamList, "TrainingGoals">;

export function TrainingGoalsScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const displayName = useOnboardingStore((state) => state.displayName);
  const fitnessLevel = useOnboardingStore((state) => state.fitnessLevel);
  const goal = useOnboardingStore((state) => state.goal);
  const weeklyTrainingDays = useOnboardingStore((state) => state.weeklyTrainingDays);
  const availableWorkoutTime = useOnboardingStore((state) => state.availableWorkoutTime);
  const equipmentAccess = useOnboardingStore((state) => state.equipmentAccess);
  const setDraft = useOnboardingStore((state) => state.setDraft);
  const [formError, setFormError] = useState<string | null>(null);
  const selectedEquipment = equipmentAccess[0] ?? null;

  function handleContinue(): void {
    if (displayName.trim().length < 2) {
      setFormError("Add a display name so your plan feels personal from the start.");
      return;
    }

    if (!selectedEquipment) {
      setFormError("Choose home or gym equipment so recommendations match your setup.");
      return;
    }

    if (equipmentAccess.length !== 1) {
      setDraft({ equipmentAccess: [selectedEquipment] });
    }

    setFormError(null);
    navigation.navigate("CycleSetup");
  }

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.topRow}>
        <AppText variant="overline" muted>
          STEP 2 OF 3
        </AppText>
      </Pressable>

      <View style={styles.header}>
        <AppText variant="h2">Build your rider profile</AppText>
        <AppText variant="subtitle" muted>
          These answers shape your starting recommendations, weekly rhythm, and equipment-aware workout suggestions.
        </AppText>
      </View>

      <AppCard style={styles.card}>
        <View style={styles.fieldBlock}>
          <AppText variant="overline" muted>
            WHAT SHOULD WE CALL YOU?
          </AppText>
          <TextInput
            value={displayName}
            onChangeText={(value) => {
              setDraft({ displayName: value });
              if (formError) {
                setFormError(null);
              }
            }}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
        </View>
        <GymPreferencesForm
          value={{
            fitnessLevel,
            goal,
            weeklyTrainingDays,
            availableWorkoutTime,
            equipmentAccess
          }}
          onChange={(patch) => {
            setDraft(patch);
            if (patch.equipmentAccess && formError) {
              setFormError(null);
            }
          }}
        />
      </AppCard>

      {formError ? <AppText style={styles.error}>{formError}</AppText> : null}

      <AppButton label="Continue to cycle setup" onPress={handleContinue} />
    </ScreenContainer>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      paddingTop: spacing.md,
      gap: spacing.lg
    },
    topRow: {
      alignSelf: "flex-start"
    },
    header: {
      gap: spacing.sm
    },
    card: {
      gap: spacing.lg
    },
    fieldBlock: {
      gap: spacing.sm
    },
    input: {
      minHeight: 52,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      color: colors.textPrimary,
      paddingHorizontal: spacing.lg
    },
    error: {
      color: colors.error
    }
  });
