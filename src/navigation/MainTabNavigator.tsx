import { MaterialIcons } from "@expo/vector-icons";
import { BottomTabBar, createBottomTabNavigator, type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import type { NavigationProp } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { ProgressScreen } from "@/screens/progress/ProgressScreen";
import { SettingsScreen } from "@/screens/settings/SettingsScreen";
import { TodayScreen } from "@/screens/today/TodayScreen";
import { WorkoutsScreen } from "@/screens/workouts/WorkoutsScreen";
import { useAppStore } from "@/store/appStore";
import { useThemeColors } from "@/theme/ThemeProvider";
import { radius, spacing, type ThemeColors } from "@/theme/tokens";

import type { MainTabParamList, RootStackParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

function iconForRoute(name: keyof MainTabParamList): keyof typeof MaterialIcons.glyphMap {
  switch (name) {
    case "Today":
      return "home";
    case "Workouts":
      return "fitness-center";
    case "Progress":
      return "bar-chart";
    case "Settings":
      return "person";
  }
}

function formatElapsedLabel(startedAtIso: string): string {
  const elapsedSeconds = Math.max(0, Math.round((Date.now() - new Date(startedAtIso).getTime()) / 1000));
  const minutes = Math.floor(elapsedSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(elapsedSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function MainTabBar(props: BottomTabBarProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const activeWorkout = useAppStore((state) => state.activeWorkout);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!activeWorkout?.startedAtIso) {
      return;
    }

    const interval = setInterval(() => {
      setTick((value) => value + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [activeWorkout?.startedAtIso]);

  const elapsedLabel = useMemo(() => {
    if (!activeWorkout?.startedAtIso) {
      return "00:00";
    }

    return formatElapsedLabel(activeWorkout.startedAtIso);
  }, [activeWorkout?.startedAtIso, tick]);

  function onResumePress(): void {
    if (!activeWorkout) {
      return;
    }

    const rootNavigation = props.navigation.getParent<NavigationProp<RootStackParamList>>();
    rootNavigation?.navigate("WorkoutSession", {
      sourceType: activeWorkout.sourceType,
      sourceId: activeWorkout.sourceId
    });
  }

  return (
    <View style={styles.tabBarWrap}>
      {activeWorkout ? (
        <Pressable style={styles.resumeWorkoutBar} onPress={onResumePress}>
          <View style={styles.resumeWorkoutLeft}>
            <View style={styles.resumeWorkoutIconWrap}>
              <MaterialIcons name="expand-less" size={16} color={colors.primary} />
            </View>
            <AppText variant="subtitle" style={styles.resumeWorkoutText}>
              Resume Workout
            </AppText>
          </View>
          <AppText variant="subtitle" style={styles.resumeWorkoutTimer}>
            {elapsedLabel}
          </AppText>
        </Pressable>
      ) : null}
      <BottomTabBar {...props} />
    </View>
  );
}

export function MainTabNavigator() {
  const colors = useThemeColors();

  return (
    <Tab.Navigator
      tabBar={(props) => <MainTabBar {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarIcon: ({ color, size }) => <MaterialIcons name={iconForRoute(route.name)} color={color} size={size} />
      })}
    >
      <Tab.Screen name="Today" component={TodayScreen} options={{ tabBarLabel: "Home" }} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Workouts" component={WorkoutsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    tabBarWrap: {
      backgroundColor: colors.surface
    },
    resumeWorkoutBar: {
      marginHorizontal: spacing.md,
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
      borderWidth: 1,
      borderColor: colors.primarySoft,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    resumeWorkoutLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    resumeWorkoutIconWrap: {
      width: 24,
      height: 24,
      borderRadius: radius.full,
      backgroundColor: colors.sage,
      alignItems: "center",
      justifyContent: "center"
    },
    resumeWorkoutText: {
      color: colors.surface
    },
    resumeWorkoutTimer: {
      color: colors.surface
    }
  });
