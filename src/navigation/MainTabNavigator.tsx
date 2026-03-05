import { MaterialIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { ProgressScreen } from "@/screens/progress/ProgressScreen";
import { SettingsScreen } from "@/screens/settings/SettingsScreen";
import { TodayScreen } from "@/screens/today/TodayScreen";
import { WorkoutsScreen } from "@/screens/workouts/WorkoutsScreen";
import { colors } from "@/theme/tokens";

import type { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

function iconForRoute(name: keyof MainTabParamList): keyof typeof MaterialIcons.glyphMap {
  switch (name) {
    case "Today":
      return "calendar-today";
    case "Workouts":
      return "fitness-center";
    case "Progress":
      return "bar-chart";
    case "Settings":
      return "person";
  }
}

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarIcon: ({ color, size }) => <MaterialIcons name={iconForRoute(route.name)} color={color} size={size} />
      })}
    >
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Workouts" component={WorkoutsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
