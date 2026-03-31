import { MaterialIcons } from "@expo/vector-icons";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { PhaseRing } from "@/components/PhaseRing";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useTodayScreen } from "@/features/today/hooks/useTodayScreen";
import { trackEvent } from "@/services/telemetry/analytics";
import { useAppStore } from "@/store/appStore";
import { useThemeColors } from "@/theme/ThemeProvider";
import { radius, spacing, type ThemeColors } from "@/theme/tokens";
import { formatEuropeanDate } from "@/utils/date";
import { useDemoMode } from "@/utils/demoMode";

import type { MainTabParamList, RootStackParamList } from "@/navigation/types";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Today">,
  NativeStackScreenProps<RootStackParamList>
>;

type CheckInModal = "mood" | "energy" | null;

const recommendationImage =
  require("../../../UI/today-recommendation.jpg");

const welcomeTemplates = [
  "Welcome back, {name}",
  "Good to see you, {name}",
  "Ready to ride, {name}?",
  "Let us make today count, {name}"
] as const;

const ratingOptions = [1, 2, 3, 4, 5] as const;

export function TodayScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    profile,
    cycleSummary,
    cycleSettings,
    cycleState,
    recommendation,
    dailyProgressState,
    moodLevel,
    energyLevel,
    setMoodLevel,
    setEnergyLevel,
    loading
  } = useTodayScreen();
  const isDemoMode = useDemoMode();
  const activeWorkout = useAppStore((state) => state.activeWorkout);
  const displayName = useMemo(() => getFirstName(profile?.display_name), [profile?.display_name]);
  const welcomeMessage = useMemo(() => buildWelcomeMessage(displayName), [displayName]);
  const todayLabel = useMemo(() => formatTodayDate(new Date()), []);
  const isActivePhaseWorkout =
    activeWorkout?.sourceType === "premium_workout" && activeWorkout?.sourceId === recommendation?.premiumWorkoutId;
  const [activeCheckInModal, setActiveCheckInModal] = useState<CheckInModal>(null);
  const [draftRating, setDraftRating] = useState(3);
  const modalKind = activeCheckInModal ?? "mood";
  const checkInSyncMessage = dailyProgressState.syncStatus === "pending" ? "Saved offline. Syncing when you're back online." : null;
  const phaseTip = useMemo(() => {
    if (!cycleSummary) return null;

    const transitionTip = getTransitionTip(cycleSummary.daysUntilNextOvulation, cycleSummary.daysUntilNextPeriod);
    const pool = [cycleSummary.phaseNote, cycleSummary.trainingFocus];

    if (transitionTip) pool.push(transitionTip);

    return pool[Math.floor(Math.random() * pool.length)] ?? null;
  }, [cycleSummary]);
  const forecastItems = useMemo(() => {
    if (!cycleSummary) {
      return [];
    }

    return [
      {
        key: "ovulation",
        label: "Next ovulation",
        date: formatEuropeanDate(cycleSummary.nextOvulationDate),
        countdown: describeCountdown(cycleSummary.daysUntilNextOvulation),
        days: cycleSummary.daysUntilNextOvulation
      },
      {
        key: "period",
        label: "Next period",
        date: formatEuropeanDate(cycleSummary.nextPeriodDate),
        countdown: describeCountdown(cycleSummary.daysUntilNextPeriod),
        days: cycleSummary.daysUntilNextPeriod
      }
    ].sort((a, b) => a.days - b.days);
  }, [cycleSummary]);

  useEffect(() => {
    if (recommendation) {
      trackEvent("recommendation_viewed", {
        recommendation: recommendation.title,
        viewedAtIso: new Date().toISOString()
      });
    }
  }, [recommendation]);

  if (loading) {
    return (
      <ScreenContainer includeBottomInset={false} contentContainerStyle={styles.loadingWrap}>
        <AppText>Loading today summary...</AppText>
      </ScreenContainer>
    );
  }

  if (!cycleSummary || !recommendation) {
    return (
      <ScreenContainer includeBottomInset={false} contentContainerStyle={styles.loadingWrap}>
        <AppText>
          {isDemoMode ? "Demo data unavailable." : "Could not load today summary. Check your backend connection."}
        </AppText>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer includeBottomInset={false} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <AppText variant="title">Today</AppText>
          <AppText variant="caption" muted>
            {welcomeMessage}
          </AppText>
          <AppText variant="caption" muted>
            {todayLabel}
          </AppText>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerGuideButton} onPress={() => navigation.navigate("PhaseGuide")}>
            <MaterialIcons name="menu-book" color={colors.primary} size={16} />
            <AppText variant="caption" style={styles.headerGuideLabel}>Guide</AppText>
          </Pressable>
          <View style={styles.headerIcon}>
            <MaterialIcons name="notifications" color={colors.primary} size={18} />
          </View>
        </View>
      </View>

      <AppCard style={styles.phaseCard}>
        <View style={styles.phaseRow}>
          {forecastItems[0] ? (
            <View style={styles.phaseSideItem}>
              <AppText variant="caption" muted style={styles.phaseSideLabel}>{forecastItems[0].label}</AppText>
              <AppText variant="bodyStrong" style={styles.phaseSideDate}>{forecastItems[0].date}</AppText>
              <AppText variant="caption" muted style={styles.phaseSideDate}>{forecastItems[0].countdown}</AppText>
            </View>
          ) : null}
          <PhaseRing
            dayInCycle={cycleSummary.dayInCycle}
            cycleLengthDays={cycleSummary.cycleLengthDays}
            periodLengthDays={cycleSettings?.period_length_days}
            phaseLabel={`${cycleSummary.phaseLabel} Phase`}
            size={160}
          />
          {forecastItems[1] ? (
            <View style={styles.phaseSideItem}>
              <AppText variant="caption" muted style={styles.phaseSideLabel}>{forecastItems[1].label}</AppText>
              <AppText variant="bodyStrong" style={styles.phaseSideDate}>{forecastItems[1].date}</AppText>
              <AppText variant="caption" muted style={styles.phaseSideDate}>{forecastItems[1].countdown}</AppText>
            </View>
          ) : null}
        </View>
        {phaseTip ? <AppText variant="caption" muted style={styles.phaseNote}>{phaseTip}</AppText> : null}
      </AppCard>

      <AppCard>
        <View style={styles.rowBetween}>
          <AppText variant="subtitle">Today's Recommendation</AppText>
          <AppText variant="overline" muted>
            WORKOUT
          </AppText>
        </View>

        <Image source={recommendationImage} style={styles.recommendationImage} resizeMode="cover" />

        <View style={styles.recommendationContent}>
          <View style={styles.rowBetween}>
            <AppText variant="title">{recommendation.title}</AppText>
            <View style={styles.durationTag}>
              <AppText variant="overline" style={styles.durationText}>
                {recommendation.durationMinutes} MIN
              </AppText>
            </View>
          </View>
          <AppText muted>{recommendation.workoutDescription}</AppText>
          <AppText variant="caption" muted>
            Also try: {recommendation.alternateWorkouts.join(" | ")}
          </AppText>
        </View>

        <View style={styles.recommendationActions}>
          <AppButton
            label="Start today's workout"
            onPress={() =>
              navigation.navigate("WorkoutSession", {
                sourceType: "premium_workout",
                sourceId: recommendation.premiumWorkoutId,
                autoStart: !isActivePhaseWorkout
              })
            }
            rightSlot={<MaterialIcons name="play-circle-filled" color={colors.onPrimary} size={18} />}
            style={[styles.recommendationActionButton, styles.recommendationPrimaryActionButton]}
          />
          <AppButton
            label="See all workouts"
            variant="outline"
            onPress={() => navigation.navigate("Workouts")}
            style={[styles.recommendationActionButton, styles.recommendationSecondaryActionButton]}
          />
        </View>
      </AppCard>

      <View style={styles.insightsRow}>
        <Pressable style={styles.checkInPressable} onPress={() => openCheckInModal("mood", moodLevel, setActiveCheckInModal, setDraftRating)}>
          <AppCard style={styles.smallInsightCard}>
            <MaterialIcons name="mood" color={colors.primary} size={20} />
            <AppText variant="bodyStrong">How are you feeling today?</AppText>
            <AppText variant="caption" muted>
              {formatCheckInSummary(moodLevel, "mood")}
            </AppText>
          </AppCard>
        </Pressable>
        <Pressable style={styles.checkInPressable} onPress={() => openCheckInModal("energy", energyLevel, setActiveCheckInModal, setDraftRating)}>
          <AppCard style={styles.smallInsightCard}>
            <MaterialIcons name="bolt" color={colors.primary} size={20} />
            <AppText variant="bodyStrong">What's your energy level?</AppText>
            <AppText variant="caption" muted>
              {formatCheckInSummary(energyLevel, "energy")}
            </AppText>
          </AppCard>
        </Pressable>
      </View>

      {checkInSyncMessage ? (
        <AppText variant="caption" muted style={styles.checkInSyncText}>
          {checkInSyncMessage}
        </AppText>
      ) : null}

      <Modal visible={activeCheckInModal !== null} transparent animationType="fade" onRequestClose={() => setActiveCheckInModal(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setActiveCheckInModal(null)}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderText}>
                <AppText variant="subtitle">
                  {activeCheckInModal === "mood" ? "How are you feeling today?" : "What's your energy level?"}
                </AppText>
                <AppText variant="caption" muted>
                  Choose a level from 1 to 5.
                </AppText>
              </View>
              <Pressable style={styles.modalCloseButton} onPress={() => setActiveCheckInModal(null)}>
                <MaterialIcons name="close" color={colors.primary} size={18} />
              </Pressable>
            </View>

            <View style={styles.ratingGrid}>
              {ratingOptions.map((option) => {
                const selected = draftRating === option;

                return (
                  <Pressable
                    key={option}
                    style={[styles.ratingOption, selected ? styles.ratingOptionSelected : undefined]}
                    onPress={() => setDraftRating(option)}
                  >
                    <AppText variant="title" style={selected ? styles.ratingOptionSelectedText : undefined}>
                      {option}
                    </AppText>
                    <AppText variant="caption" muted={!selected} style={selected ? styles.ratingOptionSelectedText : undefined}>
                      {getRatingLabel(modalKind, option)}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.modalActionRow}>
              <AppButton label="Cancel" variant="ghost" onPress={() => setActiveCheckInModal(null)} style={styles.modalActionButton} />
              <AppButton
                label="Save"
                onPress={() => {
                  if (activeCheckInModal === "mood") {
                    setMoodLevel(draftRating);
                  } else if (activeCheckInModal === "energy") {
                    setEnergyLevel(draftRating);
                  }

                  setActiveCheckInModal(null);
                }}
                style={styles.modalActionButton}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

function getFirstName(displayName: string | null | undefined): string {
  const trimmed = displayName?.trim();

  if (!trimmed) {
    return "Rider";
  }

  return trimmed.split(/\s+/)[0];
}

function buildWelcomeMessage(displayName: string): string {
  const template = welcomeTemplates[Math.floor(Math.random() * welcomeTemplates.length)];

  return template.replace("{name}", displayName);
}

function formatTodayDate(date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  return formatter.format(date);
}

function openCheckInModal(
  modal: Exclude<CheckInModal, null>,
  currentValue: number | null,
  setModal: (value: CheckInModal) => void,
  setDraftRating: (value: number) => void
): void {
  setDraftRating(currentValue ?? 3);
  setModal(modal);
}

function formatCheckInSummary(value: number | null, kind: Exclude<CheckInModal, null>): string {
  if (value === null) {
    return "Tap to log 1-5";
  }

  return `${value}/5 - ${getRatingLabel(kind, value)}`;
}

function getRatingLabel(kind: Exclude<CheckInModal, null>, value: number): string {
  if (kind === "mood") {
    return ["Very low", "Low", "Okay", "Good", "Great"][value - 1] ?? "";
  }

  return ["Drained", "Low", "Steady", "High", "Ready"][value - 1] ?? "";
}

const TRANSITION_TIPS: Record<string, string[]> = {
  ovulation: [
    "Ovulation is almost here — your energy and strength are about to peak. Start planning your hardest sessions.",
    "Peak performance window incoming. Prepare for high-intensity rides and PR attempts in the next few days.",
    "Pre-ovulation phase: estrogen is surging. A great time to push harder in training — get ready for it."
  ],
  period: [
    "Your period is approaching — dial back intensity and focus on mobility, stretching, and easy spinning.",
    "Menstrual phase incoming. Stock up on iron-rich foods and plan lighter, restorative workouts.",
    "Flow is coming. Honour your body by easing up on load and prioritising rest and recovery rides."
  ]
};

const TRANSITION_THRESHOLD_DAYS = 3;

function getTransitionTip(daysUntilNextOvulation: number, daysUntilNextPeriod: number): string | null {
  const tips: string[] = [];

  if (daysUntilNextOvulation <= TRANSITION_THRESHOLD_DAYS && daysUntilNextOvulation > 0) {
    tips.push(...TRANSITION_TIPS.ovulation);
  }

  if (daysUntilNextPeriod <= TRANSITION_THRESHOLD_DAYS && daysUntilNextPeriod > 0) {
    tips.push(...TRANSITION_TIPS.period);
  }

  if (tips.length === 0) {
    return null;
  }

  return tips[Math.floor(Math.random() * tips.length)] ?? null;
}

function describeCountdown(days: number): string {
  if (days <= 0) {
    return "Today";
  }

  if (days === 1) {
    return "In 1 day";
  }

  return `In ${days} days`;
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      paddingTop: spacing.md,
      gap: spacing.lg
    },
    loadingWrap: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center"
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    headerIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center"
    },
    headerGuideButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: spacing.sm,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface
    },
    headerGuideLabel: {
      color: colors.primary
    },
    phaseCard: {
      gap: spacing.sm,
      backgroundColor: colors.surfaceMuted
    },
    phaseRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    phaseSideItem: {
      flex: 1,
      alignItems: "center",
      gap: 2
    },
    phaseSideLabel: {
      textAlign: "center"
    },
    phaseSideDate: {
      textAlign: "center"
    },
    phaseNote: {
      textAlign: "center"
    },
    rowBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    recommendationImage: {
      width: "100%",
      height: 180,
      borderRadius: 12,
      backgroundColor: colors.surfaceMuted,
      marginTop: 14,
      marginBottom: 14
    },
    recommendationContent: {
      gap: 10,
      marginBottom: 12
    },
    durationTag: {
      borderRadius: 6,
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: 8,
      paddingVertical: 4
    },
    durationText: {
      color: colors.primary
    },
    recommendationActions: {
      flexDirection: "row",
      gap: spacing.sm,
      alignItems: "stretch"
    },
    recommendationActionButton: {
      minHeight: 58,
      paddingHorizontal: spacing.sm
    },
    recommendationPrimaryActionButton: {
      flex: 1.18
    },
    recommendationSecondaryActionButton: {
      flex: 0.92
    },
    insightsRow: {
      flexDirection: "row",
      gap: spacing.sm
    },
    checkInPressable: {
      flex: 1
    },
    smallInsightCard: {
      flex: 1,
      minHeight: 132,
      gap: spacing.xs,
      backgroundColor: colors.surfaceMuted
    },
    checkInSyncText: {
      marginTop: -8
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
      gap: spacing.md
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: spacing.md
    },
    modalHeaderText: {
      flex: 1,
      gap: 2
    },
    modalCloseButton: {
      width: 34,
      height: 34,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.full,
      backgroundColor: colors.surfaceMuted,
      alignItems: "center",
      justifyContent: "center"
    },
    ratingGrid: {
      flexDirection: "row",
      gap: spacing.sm
    },
    ratingOption: {
      flex: 1,
      minHeight: 92,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.xs
    },
    ratingOptionSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary
    },
    ratingOptionSelectedText: {
      color: colors.onPrimary
    },
    modalActionRow: {
      flexDirection: "row",
      gap: spacing.sm
    },
    modalActionButton: {
      flex: 1
    }
  });
