import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { usePremiumStatus } from "@/features/subscriptions/hooks/usePremiumStatus";
import { AuthNavigator } from "@/navigation/AuthNavigator";
import { MainTabNavigator } from "@/navigation/MainTabNavigator";
import { OnboardingNavigator } from "@/navigation/OnboardingNavigator";
import { PremiumUpsellScreen } from "@/screens/today/PremiumUpsellScreen";
import { WorkoutSessionScreen } from "@/screens/workout-session/WorkoutSessionScreen";
import { getCycleSettingsState } from "@/services/supabase/cycleService";
import { getOnboardingPreferences } from "@/services/supabase/onboardingService";
import { getProfile } from "@/services/supabase/profileService";
import { useAuthStore } from "@/store/authStore";
import { useThemeColors } from "@/theme/ThemeProvider";
import { type ThemeColors } from "@/theme/tokens";

import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigationTheme = useMemo(
    () => ({
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
    }),
    [colors]
  );

  const session = useAuthStore((state) => state.session);
  const authLoading = useAuthStore((state) => state.loading);
  const devSkipLogin = useAuthStore((state) => state.devSkipLogin);

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: Boolean(session)
  });

  const cycleQuery = useQuery({
    queryKey: ["cycleSettings"],
    queryFn: getCycleSettingsState,
    enabled: Boolean(session)
  });

  const onboardingQuery = useQuery({
    queryKey: ["onboardingPreferences"],
    queryFn: getOnboardingPreferences,
    enabled: Boolean(session)
  });

  usePremiumStatus(Boolean(session));

  if (authLoading || (session && (profileQuery.isLoading || cycleQuery.isLoading || onboardingQuery.isLoading))) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const needsOnboarding =
    Boolean(session) &&
    (!profileQuery.data?.display_name ||
      !profileQuery.data?.goal ||
      !cycleQuery.data?.settings ||
      !onboardingQuery.data?.onboarding_completed_at);

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          devSkipLogin ? (
            <Stack.Screen name="Main" component={MainTabNavigator} />
          ) : (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          )
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    loading: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background
    }
  });
