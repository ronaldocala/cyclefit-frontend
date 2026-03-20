import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { ProfileSettingsScreen } from "@/screens/settings/ProfileSettingsScreen";
import { SettingsScreen } from "@/screens/settings/SettingsScreen";

import type { SettingsStackParamList } from "./types";

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsHome" component={SettingsScreen} />
      <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
    </Stack.Navigator>
  );
}
