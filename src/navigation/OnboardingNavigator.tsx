import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { CycleSetupScreen } from "@/screens/onboarding/CycleSetupScreen";
import { TrainingGoalsScreen } from "@/screens/onboarding/TrainingGoalsScreen";

import type { OnboardingStackParamList } from "./types";

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CycleSetup" component={CycleSetupScreen} />
      <Stack.Screen name="TrainingGoals" component={TrainingGoalsScreen} />
    </Stack.Navigator>
  );
}
