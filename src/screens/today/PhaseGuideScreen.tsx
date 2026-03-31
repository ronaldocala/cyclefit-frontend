import { MaterialIcons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { ScreenContainer } from "@/components/ScreenContainer";
import { phaseGuidePhases, phaseGuidePrinciples, phaseGuideSummary } from "@/features/cycle/phaseGuideContent";
import type { RootStackParamList } from "@/navigation/types";
import { useThemeColors, useThemePhase } from "@/theme/ThemeProvider";
import { radius, spacing, type ThemeColors } from "@/theme/tokens";
import type { CyclePhase } from "@/utils/constants";

type Props = NativeStackScreenProps<RootStackParamList, "PhaseGuide">;

const phaseMeta: Record<
  CyclePhase,
  { color: string; softColor: string; icon: keyof typeof MaterialIcons.glyphMap }
> = {
  menstrual: { color: "#D9725A", softColor: "#F8E7E0", icon: "water-drop" },
  follicular: { color: "#6B7A32", softColor: "#EEF1DF", icon: "trending-up" },
  ovulation: { color: "#C9A02E", softColor: "#F7EFD2", icon: "bolt" },
  luteal: { color: "#655EAE", softColor: "#ECE8F8", icon: "self-improvement" }
};

export function PhaseGuideScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const activePhase = useThemePhase();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const currentPhaseGuide = useMemo(
    () => phaseGuidePhases.find((phase) => phase.phase === activePhase) ?? null,
    [activePhase]
  );

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={18} color={colors.primary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <AppText variant="title">Phase Guide</AppText>
          <AppText variant="caption" muted>
            General training guidance for every phase
          </AppText>
        </View>
      </View>

      <AppCard style={styles.heroCard}>
        <AppText variant="overline" style={styles.heroEyebrow}>
          CYCLEFIT+ METHOD
        </AppText>
        <AppText variant="title">{phaseGuideSummary.title}</AppText>
        <AppText muted>{phaseGuideSummary.intro}</AppText>
        <View style={styles.principlesList}>
          {phaseGuidePrinciples.map((principle) => (
            <View key={principle} style={styles.principleRow}>
              <View style={styles.principleDot} />
              <AppText muted style={styles.principleText}>
                {principle}
              </AppText>
            </View>
          ))}
        </View>
        <AppText variant="caption" muted>
          {phaseGuideSummary.note}
        </AppText>
        {currentPhaseGuide ? (
          <View style={styles.currentPhaseBanner}>
            <AppText variant="overline" style={styles.currentPhaseEyebrow}>
              CURRENTLY IN
            </AppText>
            <AppText variant="bodyStrong">
              {currentPhaseGuide.title}: {currentPhaseGuide.phaseLabel}
            </AppText>
          </View>
        ) : null}
      </AppCard>

      <AppCard style={styles.overviewCard}>
        <View style={styles.sectionHeader}>
          <AppText variant="subtitle">Monthly pattern</AppText>
          <AppText variant="caption" muted>
            Energy, recovery, and load
          </AppText>
        </View>
        {phaseGuidePhases.map((phase) => (
          <View key={phase.phase} style={styles.snapshotRow}>
            <View style={styles.snapshotTitleRow}>
              <AppText variant="bodyStrong">{phase.title}</AppText>
              <AppText variant="caption" muted>
                {phase.daysLabel}
              </AppText>
            </View>
            <View style={styles.snapshotMetrics}>
              <MetricPill label="Energy" value={phase.energyLabel} />
              <MetricPill label="Recovery" value={phase.recoveryLabel} />
              <MetricPill label="Load" value={phase.trainingLoadLabel} />
            </View>
          </View>
        ))}
      </AppCard>

      {phaseGuidePhases.map((phase) => {
        const meta = phaseMeta[phase.phase];
        const isCurrent = activePhase === phase.phase;

        return (
          <AppCard
            key={phase.phase}
            style={[
              styles.phaseCard,
              { borderLeftColor: meta.color },
              isCurrent ? styles.phaseCardCurrent : undefined
            ]}
          >
            <View style={styles.phaseHeader}>
              <View style={[styles.phaseIconWrap, { backgroundColor: meta.softColor }]}>
                <MaterialIcons name={meta.icon} size={18} color={meta.color} />
              </View>
              <View style={styles.phaseHeaderCopy}>
                <AppText variant="subtitle">{phase.title}</AppText>
                <AppText variant="caption" muted>
                  {phase.daysLabel} | {phase.phaseLabel}
                </AppText>
              </View>
              {isCurrent ? (
                <View style={styles.currentBadge}>
                  <AppText variant="overline" style={styles.currentBadgeText}>
                    NOW
                  </AppText>
                </View>
              ) : null}
            </View>

            <AppText muted>{phase.summary}</AppText>

            <View style={styles.metricRow}>
              <MetricPill label="Energy" value={phase.energyLabel} />
              <MetricPill label="Recovery" value={phase.recoveryLabel} />
              <MetricPill label="Load" value={phase.trainingLoadLabel} />
            </View>

            <View style={styles.detailBlock}>
              <AppText variant="overline" style={styles.detailHeading}>
                WHAT CHANGES
              </AppText>
              <AppText muted>{phase.biologySummary}</AppText>
            </View>

            <View style={styles.detailBlock}>
              <AppText variant="overline" style={styles.detailHeading}>
                HOW TO TRAIN
              </AppText>
              <AppText muted>{phase.trainingSummary}</AppText>
            </View>

            <View style={styles.listBlock}>
              <View style={styles.listColumn}>
                <AppText variant="overline" style={styles.detailHeading}>
                  PRIORITIZE
                </AppText>
                {phase.doItems.map((item) => (
                  <ListRow key={item} icon="check" iconColor={colors.success} text={item} />
                ))}
              </View>
              <View style={styles.listColumn}>
                <AppText variant="overline" style={styles.detailHeading}>
                  EASE OFF
                </AppText>
                {phase.avoidItems.map((item) => (
                  <ListRow key={item} icon="close" iconColor={colors.warning} text={item} />
                ))}
              </View>
            </View>

            <View style={styles.whyBlock}>
              <AppText variant="overline" style={styles.detailHeading}>
                WHY IT MATTERS
              </AppText>
              <AppText muted>{phase.whyItMatters}</AppText>
            </View>
          </AppCard>
        );
      })}
    </ScreenContainer>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={metricStyles.pill}>
      <AppText variant="caption" muted>
        {label}
      </AppText>
      <AppText variant="bodyStrong">{value}</AppText>
    </View>
  );
}

function ListRow({
  icon,
  iconColor,
  text
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  text: string;
}) {
  return (
    <View style={metricStyles.listRow}>
      <MaterialIcons name={icon} size={16} color={iconColor} />
      <AppText muted style={metricStyles.listText}>
        {text}
      </AppText>
    </View>
  );
}

const metricStyles = StyleSheet.create({
  pill: {
    flex: 1,
    minWidth: 92,
    gap: 2
  },
  listRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm
  },
  listText: {
    flex: 1
  }
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      paddingTop: spacing.md,
      gap: spacing.lg
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center"
    },
    headerCopy: {
      flex: 1,
      gap: 2
    },
    heroCard: {
      gap: spacing.md,
      backgroundColor: colors.surfaceMuted
    },
    heroEyebrow: {
      color: colors.primary
    },
    principlesList: {
      gap: spacing.sm
    },
    principleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm
    },
    principleDot: {
      width: 8,
      height: 8,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
      marginTop: 8
    },
    principleText: {
      flex: 1
    },
    currentPhaseBanner: {
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: 2
    },
    currentPhaseEyebrow: {
      color: colors.primary
    },
    overviewCard: {
      gap: spacing.md
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md
    },
    snapshotRow: {
      gap: spacing.sm,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    snapshotTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md
    },
    snapshotMetrics: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md
    },
    phaseCard: {
      gap: spacing.md,
      borderLeftWidth: 4
    },
    phaseCardCurrent: {
      backgroundColor: colors.surfaceMuted
    },
    phaseHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md
    },
    phaseIconWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center"
    },
    phaseHeaderCopy: {
      flex: 1,
      gap: 2
    },
    currentBadge: {
      borderRadius: radius.full,
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6
    },
    currentBadgeText: {
      color: colors.onPrimary
    },
    metricRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.surface
    },
    detailBlock: {
      gap: spacing.xs
    },
    detailHeading: {
      color: colors.primary
    },
    listBlock: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md
    },
    listColumn: {
      flex: 1,
      minWidth: 240,
      gap: spacing.sm
    },
    whyBlock: {
      gap: spacing.xs,
      paddingTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: colors.border
    }
  });
