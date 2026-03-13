import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { CycleSettingsState, Profile } from "@/api/types";
import { openCustomerCenter, restorePurchases } from "@/services/revenuecat/revenueCatService";
import { getCycleSettingsState, saveCycleSettings } from "@/services/supabase/cycleService";
import type { SaveCycleSettingsInput } from "@/services/supabase/cycleService";
import { deleteAccount } from "@/services/supabase/premiumService";
import { getProfile, updateProfile } from "@/services/supabase/profileService";
import { useDemoStore } from "@/store/demoStore";
import { useDemoMode } from "@/utils/demoMode";

type UpdateProfileInput = Parameters<typeof updateProfile>[0];

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
  const setDemoProfile = useDemoStore((state) => state.setProfile);
  const setDemoCycleState = useDemoStore((state) => state.setCycleState);

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

  const restoreMutation = useMutation({
    mutationFn: restorePurchases
  });

  const customerCenterMutation = useMutation({
    mutationFn: openCustomerCenter
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

  async function restorePurchasesAction(): Promise<boolean> {
    if (!isDemoMode) {
      return restoreMutation.mutateAsync();
    }

    return true;
  }

  async function openCustomerCenterAction(): Promise<boolean> {
    if (!isDemoMode) {
      return customerCenterMutation.mutateAsync();
    }

    return true;
  }

  async function deleteAccountAction(): Promise<void> {
    if (!isDemoMode) {
      return accountDeleteMutation.mutateAsync();
    }
  }

  const cycleState = isDemoMode ? demoCycleState : (cycleQuery.data ?? createEmptyCycleState());

  return {
    profile: isDemoMode ? demoProfileState : (profileQuery.data ?? null),
    cycleState,
    cycleSettings: cycleState.settings,
    loading: !isDemoMode && (profileQuery.isLoading || cycleQuery.isLoading),
    updateProfile: updateProfileAction,
    updateCycleSettings: updateCycleSettingsAction,
    restorePurchases: restorePurchasesAction,
    openCustomerCenter: openCustomerCenterAction,
    deleteAccount: deleteAccountAction,
    savingProfile: !isDemoMode && updateProfileMutation.isPending,
    savingCycleSettings: !isDemoMode && updateCycleMutation.isPending,
    restoring: !isDemoMode && restoreMutation.isPending,
    openingCustomerCenter: !isDemoMode && customerCenterMutation.isPending,
    deletingAccount: !isDemoMode && accountDeleteMutation.isPending
  };
}
