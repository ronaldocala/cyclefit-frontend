import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { CycleSettingsState, OnboardingPreferences, Profile } from "@/api/types";
import { getCycleSettingsState, saveCycleSettings } from "@/services/supabase/cycleService";
import type { SaveCycleSettingsInput } from "@/services/supabase/cycleService";
import { getOnboardingPreferences, saveOnboardingPreferences } from "@/services/supabase/onboardingService";
import type { SaveOnboardingPreferencesInput } from "@/services/supabase/onboardingService";
import { deleteAccount } from "@/services/supabase/premiumService";
import { getProfile, updateProfile } from "@/services/supabase/profileService";
import { useDemoStore } from "@/store/demoStore";
import { useDemoMode } from "@/utils/demoMode";

type UpdateProfileInput = Parameters<typeof updateProfile>[0];
type SaveTrainingPreferencesInput = {
  profile: Pick<UpdateProfileInput, "goal" | "fitness_level">;
  onboarding: SaveOnboardingPreferencesInput;
};

function createEmptyCycleState(): CycleSettingsState {
  return {
    settings: null,
    syncStatus: "synced",
    lastSyncedAt: null
  };
}

export function useSettingsScreen() {
  const queryClient = useQueryClient();
  const isDemoMode = useDemoMode();
  const demoProfileState = useDemoStore((state) => state.profile);
  const demoCycleState = useDemoStore((state) => state.cycleState);
  const demoOnboardingPreferences = useDemoStore((state) => state.onboardingPreferences);
  const setDemoProfile = useDemoStore((state) => state.setProfile);
  const setDemoCycleState = useDemoStore((state) => state.setCycleState);
  const setDemoOnboardingPreferences = useDemoStore((state) => state.setOnboardingPreferences);

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: !isDemoMode
  });

  const cycleQuery = useQuery({
    queryKey: ["cycleSettings"],
    queryFn: getCycleSettingsState,
    enabled: !isDemoMode
  });

  const onboardingPreferencesQuery = useQuery({
    queryKey: ["onboardingPreferences"],
    queryFn: getOnboardingPreferences,
    enabled: !isDemoMode
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(["profile"], profile);
    }
  });

  const updateCycleMutation = useMutation({
    mutationFn: saveCycleSettings,
    onSuccess: (cycleState) => {
      queryClient.setQueryData(["cycleSettings"], cycleState);
    }
  });

  const updateTrainingPreferencesMutation = useMutation({
    mutationFn: async (input: SaveTrainingPreferencesInput) => {
      const [nextProfile, nextOnboardingPreferences] = await Promise.all([
        updateProfile(input.profile),
        saveOnboardingPreferences(input.onboarding)
      ]);

      return {
        profile: nextProfile,
        onboardingPreferences: nextOnboardingPreferences
      };
    },
    onSuccess: ({ profile, onboardingPreferences }) => {
      queryClient.setQueryData(["profile"], profile);
      queryClient.setQueryData(["onboardingPreferences"], onboardingPreferences);
    }
  });

  const accountDeleteMutation = useMutation({
    mutationFn: deleteAccount
  });

  async function updateProfileAction(input: UpdateProfileInput): Promise<Profile> {
    if (!isDemoMode) {
      return updateProfileMutation.mutateAsync(input);
    }

    return setDemoProfile(input);
  }

  async function updateCycleSettingsAction(input: SaveCycleSettingsInput): Promise<CycleSettingsState> {
    if (!isDemoMode) {
      return updateCycleMutation.mutateAsync(input);
    }

    return setDemoCycleState(input);
  }

  async function saveTrainingPreferencesAction(input: SaveTrainingPreferencesInput): Promise<{
    profile: Profile;
    onboardingPreferences: OnboardingPreferences;
  }> {
    if (!isDemoMode) {
      return updateTrainingPreferencesMutation.mutateAsync(input);
    }

    return {
      profile: setDemoProfile(input.profile),
      onboardingPreferences: setDemoOnboardingPreferences(input.onboarding)
    };
  }

  async function deleteAccountAction(): Promise<void> {
    if (!isDemoMode) {
      return accountDeleteMutation.mutateAsync();
    }
  }

  const cycleState = isDemoMode ? demoCycleState : (cycleQuery.data ?? createEmptyCycleState());

  return {
    profile: isDemoMode ? demoProfileState : (profileQuery.data ?? null),
    onboardingPreferences: isDemoMode ? demoOnboardingPreferences : (onboardingPreferencesQuery.data ?? null),
    cycleState,
    cycleSettings: cycleState.settings,
    loading: !isDemoMode && (profileQuery.isLoading || cycleQuery.isLoading || onboardingPreferencesQuery.isLoading),
    updateProfile: updateProfileAction,
    saveTrainingPreferences: saveTrainingPreferencesAction,
    updateCycleSettings: updateCycleSettingsAction,
    deleteAccount: deleteAccountAction,
    savingProfile: !isDemoMode && updateProfileMutation.isPending,
    savingTrainingPreferences: !isDemoMode && updateTrainingPreferencesMutation.isPending,
    savingCycleSettings: !isDemoMode && updateCycleMutation.isPending,
    deletingAccount: !isDemoMode && accountDeleteMutation.isPending
  };
}
