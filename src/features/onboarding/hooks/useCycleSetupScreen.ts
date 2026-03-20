import { useMutation, useQueryClient } from "@tanstack/react-query";

import { saveCycleSettings, type SaveCycleSettingsInput } from "@/services/supabase/cycleService";
import { saveOnboardingPreferences } from "@/services/supabase/onboardingService";
import { updateProfile } from "@/services/supabase/profileService";
import { trackEvent } from "@/services/telemetry/analytics";
import { useOnboardingStore } from "@/store/onboardingStore";
import { parseUnknownError } from "@/utils/errors";

export function useCycleSetupScreen() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (payload: SaveCycleSettingsInput) => {
      const onboarding = useOnboardingStore.getState();

      const [profile, preferences, cycleState] = await Promise.all([
        updateProfile({
          display_name: onboarding.displayName.trim() || "Athlete",
          goal: onboarding.goal,
          fitness_level: onboarding.fitnessLevel
        }),
        saveOnboardingPreferences({
          equipment_access: onboarding.equipmentAccess,
          weekly_training_days: onboarding.weeklyTrainingDays,
          riding_environment: onboarding.ridingEnvironment,
          available_workout_time: onboarding.availableWorkoutTime
        }),
        saveCycleSettings(payload)
      ]);

      return {
        profile,
        preferences,
        cycleState
      };
    },
    onSuccess: ({ profile, preferences, cycleState }) => {
      trackEvent("onboarding_completed", {
        atIso: new Date().toISOString(),
        fitnessLevel: profile.fitness_level,
        goal: profile.goal
      });
      queryClient.setQueryData(["profile"], profile);
      queryClient.setQueryData(["onboardingPreferences"], preferences);
      queryClient.setQueryData(["cycleSettings"], cycleState);
      useOnboardingStore.getState().reset();
    }
  });

  return {
    completeOnboarding: mutation.mutateAsync,
    loading: mutation.isPending,
    error: mutation.error ? parseUnknownError(mutation.error).message : null
  };
}
