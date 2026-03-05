import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useWorkoutsScreen } from "@/features/workouts/hooks/useWorkoutsScreen";
import { colors, spacing } from "@/theme/tokens";

import type { MainTabParamList, RootStackParamList } from "@/navigation/types";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Workouts">,
  NativeStackScreenProps<RootStackParamList>
>;

export function WorkoutsScreen({ navigation }: Props) {
  const { isPremium, userWorkouts, premiumWorkouts, loading } = useWorkoutsScreen();

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="title">Workouts</AppText>
        <AppText variant="caption" muted>
          {isPremium ? "Premium access active" : "Free access"}
        </AppText>
      </View>

      {loading ? <AppText>Loading workouts...</AppText> : null}

      <AppCard>
        <AppText variant="subtitle">Workout Builder</AppText>
        <AppText muted>Create and log your own workouts, available for all users.</AppText>
        <AppButton
          label="Start quick session"
          onPress={() => navigation.navigate("WorkoutSession", { sourceType: "quick_log" })}
        />
      </AppCard>

      <AppCard>
        <AppText variant="subtitle">Exercise Library</AppText>
        <AppText muted>Browse movements and add them to your routine.</AppText>
        <AppButton label="Explore exercises" variant="outline" />
      </AppCard>

      {isPremium ? (
        <AppCard>
          <AppText variant="subtitle">Premade Workouts</AppText>
          {premiumWorkouts.length ? (
            premiumWorkouts.slice(0, 3).map((workout) => (
              <View style={styles.itemRow} key={workout.id}>
                <AppText variant="bodyStrong">{workout.name}</AppText>
                <AppText variant="caption" muted>
                  {workout.est_duration_minutes ?? 30} mins
                </AppText>
              </View>
            ))
          ) : (
            <AppText muted>No premium workouts published yet.</AppText>
          )}
        </AppCard>
      ) : (
        <AppCard style={styles.softCard}>
          <AppText variant="subtitle">Plan Calendar</AppText>
          <AppText muted>Upgrade to access guided week view and premade plans.</AppText>
          <AppButton label="See Premium" variant="secondary" onPress={() => navigation.navigate("PremiumUpsell")} />
        </AppCard>
      )}

      <AppCard>
        <AppText variant="subtitle">History</AppText>
        {userWorkouts.length ? (
          userWorkouts.slice(0, 5).map((workout) => (
            <View style={styles.itemRow} key={workout.id}>
              <AppText variant="bodyStrong">{workout.name}</AppText>
              <AppText variant="caption" muted>
                Updated {new Date(workout.updated_at).toDateString()}
              </AppText>
            </View>
          ))
        ) : (
          <AppText muted>No saved workouts yet.</AppText>
        )}
      </AppCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingTop: spacing.md
  },
  header: {
    gap: 4
  },
  itemRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  softCard: {
    backgroundColor: "#EEF3F1"
  }
});
