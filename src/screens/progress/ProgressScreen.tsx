import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useProgressScreen } from "@/features/progress/hooks/useProgressScreen";
import { useThemeColors } from "@/theme/ThemeProvider";
import { spacing, type ThemeColors } from "@/theme/tokens";

export function ProgressScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { loading, stats, cycleSummary } = useProgressScreen();

  return (
    <ScreenContainer includeBottomInset={false} contentContainerStyle={styles.content}>
      <AppText variant="title">Progress</AppText>

      {loading ? <AppText>Loading progress...</AppText> : null}

      {cycleSummary ? (
        <AppCard style={styles.phaseCard}>
          <AppText variant="subtitle">{cycleSummary.phaseLabel} phase</AppText>
          <AppText muted>{cycleSummary.phaseNote}</AppText>
          <AppText variant="caption" muted>
            Next period in {cycleSummary.daysUntilNextPeriod} days. Recovery focus: {cycleSummary.recoveryFocus}
          </AppText>
        </AppCard>
      ) : null}

      <AppCard>
        <AppText variant="subtitle">Overview</AppText>
        <View style={styles.row}>
          <View style={styles.metricBox}>
            <AppText variant="h2">{stats.completedWorkouts}</AppText>
            <AppText variant="caption" muted>
              Completed workouts
            </AppText>
          </View>
          <View style={styles.metricBox}>
            <AppText variant="h2">{stats.totalMinutes}</AppText>
            <AppText variant="caption" muted>
              Total minutes
            </AppText>
          </View>
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="subtitle">7-session trend</AppText>
        <View style={styles.bars}>
          {stats.weeklyTrend.map((minutes, index) => (
            <View key={`${minutes}-${index}`} style={styles.barWrap}>
              <View style={[styles.bar, { height: Math.max(12, minutes) }]} />
              <AppText variant="caption" muted>
                {minutes}
              </AppText>
            </View>
          ))}
        </View>
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
    row: {
      flexDirection: "row",
      gap: spacing.sm
    },
    phaseCard: {
      gap: spacing.xs,
      backgroundColor: colors.surfaceMuted
    },
    metricBox: {
      flex: 1,
      borderRadius: 12,
      backgroundColor: colors.surfaceMuted,
      padding: spacing.lg,
      gap: 4
    },
    bars: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: spacing.sm
    },
    barWrap: {
      alignItems: "center",
      gap: 4
    },
    bar: {
      width: 18,
      borderRadius: 6,
      backgroundColor: colors.sage
    }
  });
