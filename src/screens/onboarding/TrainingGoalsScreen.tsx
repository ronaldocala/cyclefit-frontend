import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { useMemo, useState } from "react";

import { AppButton } from "@/components/AppButton";
import { AppText } from "@/components/AppText";
import { ScreenContainer } from "@/components/ScreenContainer";
import { updateProfile } from "@/services/supabase/profileService";
import { useThemeColors } from "@/theme/ThemeProvider";
import { radius, spacing, type ThemeColors } from "@/theme/tokens";

import type { OnboardingStackParamList } from "@/navigation/types";

const bikeUri =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDrNXqo-wvrEXASXJBye9NCwsJ7I5d4VllN2axlj_3u-CLmuwlOLeZ9WqvrbC5_4iyMjrnQrAvdkvtk8Z73NpieMvX3h1WRNP-E_Toxko6Rg4vpG5BARkTrqYWEkNZ_78Kq90qm0GVrMpAxAqSHpBMjXAd0j1O69WFvKai6D52cO7KTefdZuceVYIADlAlUMqrzOCwZTq0-er2EjFRj5t37I9g28OU0oJ4o50RUpa9Yjwywi1MX3Xw2rv8Z6gDiW4MqdPEIKv8uzlU";

type Props = NativeStackScreenProps<OnboardingStackParamList, "TrainingGoals">;

const levels = ["beginner", "intermediate", "advanced"] as const;
const durations = ["15 mins", "30 mins", "45+ mins"] as const;

export function TrainingGoalsScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [level, setLevel] = useState<(typeof levels)[number]>("beginner");
  const [duration, setDuration] = useState<(typeof durations)[number]>("30 mins");
  const [saving, setSaving] = useState(false);

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()}>
        <AppText variant="subtitle" muted>
          Back
        </AppText>
      </Pressable>

      <AppText variant="h2" style={styles.title}>
        Your training goals
      </AppText>

      <View style={styles.section}>
        <AppText variant="overline" muted>
          EXPERIENCE LEVEL
        </AppText>
        <View style={styles.optionRow}>
          {levels.map((option) => (
            <Pressable key={option} onPress={() => setLevel(option)} style={[styles.option, level === option ? styles.optionActive : undefined]}>
              <AppText variant="bodyStrong" style={level === option ? styles.optionActiveText : styles.optionText}>
                {option[0].toUpperCase() + option.slice(1)}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="overline" muted>
          TIME AVAILABLE
        </AppText>
        <View style={styles.optionRow}>
          {durations.map((option) => (
            <Pressable
              key={option}
              onPress={() => setDuration(option)}
              style={[styles.option, duration === option ? styles.optionActive : undefined]}
            >
              <AppText variant="bodyStrong" style={duration === option ? styles.optionActiveText : styles.optionText}>
                {option}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.heroWrap}>
        <Image source={{ uri: bikeUri }} style={styles.hero} />
        <View style={styles.heroTag}>
          <AppText variant="caption" style={styles.heroTagText}>
            Personalized routines
          </AppText>
        </View>
      </View>

      <AppButton
        label={saving ? "Saving..." : "Continue"}
        onPress={async () => {
          setSaving(true);
          await updateProfile({
            display_name: "Athlete",
            goal: `Time available: ${duration}`,
            fitness_level: level
          });
          setSaving(false);
          navigation.getParent()?.getParent()?.navigate("Main");
        }}
      />

      <AppText variant="caption" muted style={styles.note}>
        You can change these later in settings
      </AppText>
    </ScreenContainer>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      paddingTop: spacing.md,
      gap: spacing.lg
    },
    title: {
      color: colors.primarySoft
    },
    section: {
      gap: spacing.md
    },
    optionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    option: {
      minWidth: 108,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      minHeight: 42,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.md
    },
    optionActive: {
      backgroundColor: colors.sage,
      borderColor: colors.sage
    },
    optionText: {
      color: colors.textSecondary
    },
    optionActiveText: {
      color: colors.primary
    },
    heroWrap: {
      borderRadius: radius.lg,
      overflow: "hidden",
      position: "relative"
    },
    hero: {
      width: "100%",
      height: 180
    },
    heroTag: {
      position: "absolute",
      left: spacing.lg,
      bottom: spacing.lg,
      backgroundColor: "rgba(247,245,242,0.9)",
      borderRadius: radius.full,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md
    },
    heroTagText: {
      color: colors.primary
    },
    note: {
      textAlign: "center"
    }
  });
