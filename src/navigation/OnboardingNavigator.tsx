import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { OnboardingIntroScreen } from "@/screens/onboarding/OnboardingIntroScreen";
import { CycleSetupScreen } from "@/screens/onboarding/CycleSetupScreen";
import { TrainingGoalsScreen } from "@/screens/onboarding/TrainingGoalsScreen";

import type { OnboardingStackParamList } from "./types";

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Intro" component={OnboardingIntroScreen} />
      <Stack.Screen name="TrainingGoals" component={TrainingGoalsScreen} />
      <Stack.Screen name="CycleSetup" component={CycleSetupScreen} />
    </Stack.Navigator>
  );
}
