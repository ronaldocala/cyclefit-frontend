import { MaterialIcons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useCycleSetupScreen } from "@/features/onboarding/hooks/useCycleSetupScreen";
import { colors, radius, spacing } from "@/theme/tokens";
import { toIsoDate } from "@/utils/date";

import type { OnboardingStackParamList } from "@/navigation/types";

const schema = z.object({
  last_period_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
  cycle_length_days: z.number().min(15).max(60),
  period_length_days: z.number().min(1).max(15)
});

type FormValues = z.infer<typeof schema>;

type Props = NativeStackScreenProps<OnboardingStackParamList, "CycleSetup">;

const cycleOptions = [24, 26, 28, 30, 32];
const periodOptions = [3, 4, 5, 6, 7];

export function CycleSetupScreen({ navigation }: Props) {
  const { saveSettings, loading } = useCycleSetupScreen();

  const { watch, setValue, register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      last_period_date: toIsoDate(new Date()),
      cycle_length_days: 28,
      period_length_days: 5
    }
  });

  register("last_period_date");

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={24} color={colors.primarySoft} />
        <AppText variant="overline" muted>
          STEP 1 OF 3
        </AppText>
      </Pressable>

      <View style={styles.header}>
        <AppText variant="h2">Understand your cycle</AppText>
        <AppText variant="subtitle" muted>
          To give you the best predictions and personalized workouts, we need a few details about your rhythm.
        </AppText>
      </View>

      <AppCard style={styles.formCard}>
        <AppText variant="bodyStrong">Last period start date</AppText>
        <TextInput
          value={watch("last_period_date")}
          onChangeText={(value) => setValue("last_period_date", value, { shouldValidate: true })}
          style={styles.input}
          placeholder="YYYY-MM-DD"
        />

        <AppText variant="bodyStrong">Average cycle length</AppText>
        <View style={styles.chipRow}>
          {cycleOptions.map((option) => (
            <Pressable
              key={option}
              onPress={() => setValue("cycle_length_days", option, { shouldValidate: true })}
              style={[styles.chip, watch("cycle_length_days") === option ? styles.chipActive : undefined]}
            >
              <AppText variant="caption" style={watch("cycle_length_days") === option ? styles.chipActiveText : undefined}>
                {option} days
              </AppText>
            </Pressable>
          ))}
        </View>

        <AppText variant="caption" muted>
          From the first day of one period to the first day of the next.
        </AppText>

        <AppText variant="bodyStrong">Average period length</AppText>
        <View style={styles.chipRow}>
          {periodOptions.map((option) => (
            <Pressable
              key={option}
              onPress={() => setValue("period_length_days", option, { shouldValidate: true })}
              style={[styles.chip, watch("period_length_days") === option ? styles.chipActive : undefined]}
            >
              <AppText variant="caption" style={watch("period_length_days") === option ? styles.chipActiveText : undefined}>
                {option} days
              </AppText>
            </Pressable>
          ))}
        </View>
      </AppCard>

      <AppCard style={styles.tipCard}>
        <View style={styles.tipRow}>
          <MaterialIcons name="info" size={18} color={colors.primarySoft} />
          <AppText variant="body" muted style={styles.tipText}>
            Your data is encrypted and used only to personalize your health insights.
          </AppText>
        </View>
      </AppCard>

      {formState.errors.last_period_date?.message ? <AppText style={styles.error}>{formState.errors.last_period_date.message}</AppText> : null}

      <AppButton
        label={loading ? "Saving..." : "Continue"}
        onPress={handleSubmit(async (values) => {
          await saveSettings(values);
          navigation.navigate("TrainingGoals");
        })}
        rightSlot={<MaterialIcons name="arrow-forward" size={20} color={colors.surface} />}
      />

      <AppButton label="I'm not sure, use defaults" variant="ghost" onPress={() => navigation.navigate("TrainingGoals")} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    minHeight: 50,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  chip: {
    paddingHorizontal: spacing.md,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface
  },
  chipActive: {
    backgroundColor: colors.sage,
    borderColor: colors.sage
  },
  chipActiveText: {
    color: colors.primary
  },
  tipCard: {
    backgroundColor: "#F4F8F7",
    borderStyle: "dashed"
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  tipText: {
    flex: 1
  },
  error: {
    color: colors.error
  }
});
