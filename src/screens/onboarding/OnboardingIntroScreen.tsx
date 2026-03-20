import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useThemeColors } from "@/theme/ThemeProvider";
import { radius, spacing, type ThemeColors } from "@/theme/tokens";

import type { OnboardingStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Intro">;

const pillars = [
  {
    eyebrow: "01",
    title: "Adapts to your energy."
  },
  {
    eyebrow: "02",
    title: "Fits your equipment."
  },
  {
    eyebrow: "03",
    title: "Gets smarter as you train."
  }
] as const;

const guidanceModes = [
  {
    label: "Train",
    title: "Push when ready"
  },
  {
    label: "Recover",
    title: "Ease off when needed"
  }
] as const;

export function OnboardingIntroScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="overline" muted>
          STEP 1 OF 3
        </AppText>
        <AppText variant="h1" style={styles.title}>
          Meet your cycle-aware training guide.
        </AppText>
        <AppText variant="subtitle" muted style={styles.subtitle}>
          A quick setup makes your plan feel personal from day one.
        </AppText>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <AppText variant="caption" style={styles.heroBadgeText}>
            Personalized from session one
          </AppText>
        </View>
        <View style={styles.heroOrbPrimary} />
        <View style={styles.heroOrbSecondary} />
        <View style={styles.heroCopy}>
          <AppText variant="title" style={styles.heroTitle}>
            Knows when to push. Knows when to ease off.
          </AppText>
        </View>
        <View style={styles.heroGrid}>
          {guidanceModes.map((mode) => (
            <View key={mode.label} style={styles.heroColumn}>
              <AppText variant="overline" muted>
                {mode.label}
              </AppText>
              <AppText variant="bodyStrong" style={styles.modeTitle}>
                {mode.title}
              </AppText>
            </View>
          ))}
        </View>
      </View>

      <AppCard style={styles.featureSheet}>
        <View style={styles.sheetHeader}>
          <AppText variant="overline" muted>
            What setup does
          </AppText>
          <AppText variant="subtitle" style={styles.sheetTitle}>
            Three things change right away.
          </AppText>
        </View>
        <View style={styles.featureList}>
          {pillars.map((pillar, index) => (
            <View
              key={pillar.title}
              style={[styles.featureRow, index < pillars.length - 1 ? styles.featureRowBorder : undefined]}
            >
              <View style={styles.featureBadge}>
                <AppText variant="caption" style={styles.featureBadgeText}>
                  {pillar.eyebrow}
                </AppText>
              </View>
              <View style={styles.featureCopy}>
                <AppText variant="bodyStrong" style={styles.featureTitle}>
                  {pillar.title}
                </AppText>
              </View>
            </View>
          ))}
        </View>
      </AppCard>

      <View style={styles.privacyNote}>
        <AppText variant="caption" muted>
          You can edit this later in settings.
        </AppText>
      </View>

      <AppButton
        label="Start setup"
        onPress={() => navigation.navigate("TrainingGoals")}
        style={styles.cta}
      />
    </ScreenContainer>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      paddingTop: spacing.lg,
      gap: spacing.lg
    },
    header: {
      gap: spacing.sm
    },
    title: {
      color: colors.primary
    },
    subtitle: {
      maxWidth: 560
    },
    hero: {
      minHeight: 256,
      borderRadius: radius.xl,
      padding: spacing.xl,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
      gap: spacing.lg
    },
    heroBadge: {
      alignSelf: "flex-start",
      borderRadius: radius.full,
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: 6
    },
    heroBadgeText: {
      color: colors.surface
    },
    heroOrbPrimary: {
      position: "absolute",
      width: 160,
      height: 160,
      borderRadius: 80,
      right: -18,
      top: 36,
      backgroundColor: colors.sage,
      opacity: 0.58
    },
    heroOrbSecondary: {
      position: "absolute",
      width: 86,
      height: 86,
      borderRadius: 43,
      left: -16,
      bottom: 62,
      backgroundColor: colors.surface,
      opacity: 0.82
    },
    heroCopy: {
      paddingRight: spacing.xxxl
    },
    heroTitle: {
      color: colors.primary
    },
    heroGrid: {
      flexDirection: "row",
      gap: spacing.md
    },
    heroColumn: {
      flex: 1,
      gap: spacing.xs,
      borderRadius: radius.lg,
      backgroundColor: "rgba(255,255,255,0.74)",
      padding: spacing.md
    },
    modeTitle: {
      color: colors.primary
    },
    featureSheet: {
      gap: spacing.lg,
      padding: spacing.xl
    },
    sheetHeader: {
      gap: spacing.sm
    },
    sheetTitle: {
      color: colors.primary
    },
    featureList: {
      gap: spacing.md
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.md
    },
    featureRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: spacing.md
    },
    featureBadge: {
      width: 36,
      height: 36,
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceMuted
    },
    featureBadgeText: {
      color: colors.primary
    },
    featureCopy: {
      flex: 1,
      justifyContent: "center"
    },
    featureTitle: {
      color: colors.primary
    },
    privacyNote: {
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.xs
    },
    cta: {
      marginTop: spacing.xs
    }
  });
