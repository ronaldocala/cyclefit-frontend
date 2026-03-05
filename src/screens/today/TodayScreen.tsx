import { MaterialIcons } from "@expo/vector-icons";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { PhaseRing } from "@/components/PhaseRing";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useTodayScreen } from "@/features/today/hooks/useTodayScreen";
import { trackEvent } from "@/services/telemetry/analytics";
import { updateProfile } from "@/services/supabase/profileService";
import { useAppStore } from "@/store/appStore";
import { colors, spacing } from "@/theme/tokens";
import { phases, type CyclePhase } from "@/utils/constants";

import type { MainTabParamList, RootStackParamList } from "@/navigation/types";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Today">,
  NativeStackScreenProps<RootStackParamList>
>;

const recommendationImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAvA7FPN30Jq1T-2kC_f0pGuPbtApNaoidbQ_J4Rhh-t13P8ON1T8NC5Ocqcjzv3mHcI3AAEWZ9SL6xrP1Qs0oUS5C717BI1UYV08vIeDhRJWtKMc-6aO_e4AtopR3G1qmoYsGI_Y3mZzPjt-SYsCWfTS2-vdiIgO6KzCW-urTIb21ShD9Wm1oL7YJ-jb3d1B4c6rWhsIoCH4Ap717jcl0idjo3grAdmr_NuB6mf3QemocyWtq91RKLrK6TwB6Pqxs7yPUwxiVTsac";

export function TodayScreen({ navigation }: Props) {
  const { isPremium, cycleSummary, recommendation, loading } = useTodayScreen();
  const phaseOverride = useAppStore((state) => state.phaseOverride);
  const setPhaseOverride = useAppStore((state) => state.setPhaseOverride);

  useEffect(() => {
    if (recommendation) {
      trackEvent("recommendation_viewed", {
        recommendation: recommendation.title,
        viewedAtIso: new Date().toISOString()
      });
    }
  }, [recommendation]);

  if (loading || !cycleSummary || !recommendation) {
    return (
      <ScreenContainer contentContainerStyle={styles.loadingWrap}>
        <AppText>Loading today summary...</AppText>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <AppText variant="title">Today</AppText>
          <AppText variant="caption" muted>
            {new Date().toDateString()}
          </AppText>
        </View>
        <View style={styles.headerIcon}>
          <MaterialIcons name="notifications" color={colors.primary} size={18} />
        </View>
      </View>

      <PhaseRing
        dayInCycle={cycleSummary.dayInCycle}
        cycleLengthDays={cycleSummary.cycleLengthDays}
        phaseLabel={`${cycleSummary.phase[0].toUpperCase()}${cycleSummary.phase.slice(1)} Phase`}
      />

      <AppText muted style={styles.note}>
        {cycleSummary.phaseNote}
      </AppText>

      <AppCard>
        <View style={styles.rowBetween}>
          <AppText variant="subtitle">Today's Recommendation</AppText>
          <AppText variant="overline" muted>
            WORKOUT
          </AppText>
        </View>

        {isPremium ? (
          <View style={styles.premiumInlineBadge}>
            <AppText variant="caption" style={styles.premiumInlineText}>
              Premium
            </AppText>
          </View>
        ) : null}

        <Image source={{ uri: recommendationImage }} style={styles.recommendationImage} />

        <View style={styles.recommendationContent}>
          <View style={styles.rowBetween}>
            <AppText variant="title">{recommendation.title}</AppText>
            <View style={styles.durationTag}>
              <AppText variant="overline" style={styles.durationText}>
                35 MIN
              </AppText>
            </View>
          </View>
          <AppText muted>
            Focus on form and consistency, align training effort with your cycle for better recovery.
          </AppText>
        </View>

        {isPremium ? (
          <AppButton
            label={recommendation.premiumAction}
            onPress={() => navigation.navigate("WorkoutSession", { sourceType: "premium_workout" })}
            rightSlot={<MaterialIcons name="play-circle-filled" color={colors.surface} size={20} />}
          />
        ) : (
          <View style={styles.freeActions}>
            <AppButton label={recommendation.freeActions[0]} variant="secondary" onPress={() => navigation.navigate("Workouts")} />
            <AppButton label={recommendation.freeActions[1]} variant="outline" onPress={() => navigation.navigate("Workouts")} />
          </View>
        )}
      </AppCard>

      {!isPremium ? (
        <AppCard style={styles.upgradeCard}>
          <View>
            <AppText variant="bodyStrong" style={styles.upgradeTitle}>
              Unlock Personalized Nutrition
            </AppText>
            <AppText variant="caption" style={styles.upgradeSubtitle}>
              Match your meals to your cycle
            </AppText>
          </View>
          <AppButton
            label="Upgrade"
            variant="secondary"
            onPress={() => {
              trackEvent("paywall_viewed", { source: "today_footer", atIso: new Date().toISOString() });
              navigation.navigate("PremiumUpsell");
            }}
          />
        </AppCard>
      ) : (
        <View style={styles.insightsRow}>
          <AppCard style={styles.smallInsightCard}>
            <MaterialIcons name="restaurant" color={colors.sage} size={20} />
            <AppText variant="overline" muted>
              NUTRITION
            </AppText>
            <AppText variant="bodyStrong">Iron-rich foods</AppText>
          </AppCard>
          <AppCard style={styles.smallInsightCard}>
            <MaterialIcons name="bedtime" color={colors.sage} size={20} />
            <AppText variant="overline" muted>
              SLEEP GOAL
            </AppText>
            <AppText variant="bodyStrong">8h 15m suggested</AppText>
          </AppCard>
        </View>
      )}

      <View style={styles.overrideSection}>
        <AppText variant="caption" muted>
          Manual phase override
        </AppText>
        <View style={styles.chipRow}>
          <Pressable style={[styles.overrideChip, phaseOverride === null ? styles.overrideChipActive : undefined]} onPress={() => void handlePhaseOverride(null, setPhaseOverride)}>
            <AppText variant="caption">Auto</AppText>
          </Pressable>
          {phases.map((phase) => (
            <Pressable
              key={phase}
              style={[styles.overrideChip, phaseOverride === phase ? styles.overrideChipActive : undefined]}
              onPress={() => void handlePhaseOverride(phase, setPhaseOverride)}
            >
              <AppText variant="caption">{phase}</AppText>
            </Pressable>
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
}

async function handlePhaseOverride(phase: CyclePhase | null, setPhaseOverride: (phase: CyclePhase | null) => void): Promise<void> {
  setPhaseOverride(phase);
  trackEvent("phase_override_set", { phase: phase ?? "auto", atIso: new Date().toISOString() });

  if (phase) {
    await updateProfile({ last_seen_phase: phase });
  }
}

const styles = StyleSheet.create({
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
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center"
  },
  note: {
    textAlign: "center"
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  premiumInlineBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#EAF2EF",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginTop: 8
  },
  premiumInlineText: {
    color: colors.primary
  },
  recommendationImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginTop: 14,
    marginBottom: 14
  },
  recommendationContent: {
    gap: 10,
    marginBottom: 12
  },
  durationTag: {
    borderRadius: 6,
    backgroundColor: "#E6ECE9",
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  durationText: {
    color: colors.primary
  },
  freeActions: {
    gap: spacing.sm
  },
  upgradeCard: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  upgradeTitle: {
    color: colors.surface
  },
  upgradeSubtitle: {
    color: "#D8E3DE"
  },
  insightsRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  smallInsightCard: {
    flex: 1,
    gap: 6,
    backgroundColor: "#EEF2F0"
  },
  overrideSection: {
    gap: spacing.sm
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  overrideChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface
  },
  overrideChipActive: {
    borderColor: colors.sage,
    backgroundColor: colors.sage
  }
});
