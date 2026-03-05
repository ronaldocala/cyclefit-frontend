import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { usePremiumStatus } from "@/features/subscriptions/hooks/usePremiumStatus";
import { AuthNavigator } from "@/navigation/AuthNavigator";
import { MainTabNavigator } from "@/navigation/MainTabNavigator";
import { OnboardingNavigator } from "@/navigation/OnboardingNavigator";
import { PremiumUpsellScreen } from "@/screens/today/PremiumUpsellScreen";
import { WorkoutSessionScreen } from "@/screens/workout-session/WorkoutSessionScreen";
import { getProfile } from "@/services/supabase/profileService";
import { colors } from "@/theme/tokens";
import { useAuthStore } from "@/store/authStore";

import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.primary,
    notification: colors.primarySoft
  }
};

export function AppNavigator() {
  const session = useAuthStore((state) => state.session);
  const authLoading = useAuthStore((state) => state.loading);

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: Boolean(session)
  });

  usePremiumStatus(Boolean(session));

  if (authLoading || (session && profileQuery.isLoading)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const needsOnboarding =
    Boolean(session) && (!profileQuery.data?.display_name || !profileQuery.data?.goal);

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : needsOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        )}
        <Stack.Screen name="PremiumUpsell" component={PremiumUpsellScreen} options={{ presentation: "modal" }} />
        <Stack.Screen name="WorkoutSession" component={WorkoutSessionScreen} options={{ presentation: "modal" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background
  }
});
