import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Profile } from "@/api/types";
import { demoCycleSettings, demoProfile } from "@/services/demo/demoData";
import { openCustomerCenter, restorePurchases } from "@/services/revenuecat/revenueCatService";
import { getCycleSettings, saveCycleSettings } from "@/services/supabase/cycleService";
import type { SaveCycleSettingsInput } from "@/services/supabase/cycleService";
import { deleteAccount } from "@/services/supabase/premiumService";
import { getProfile, updateProfile } from "@/services/supabase/profileService";
import { useDemoMode } from "@/utils/demoMode";

type UpdateProfileInput = Parameters<typeof updateProfile>[0];

export function useSettingsScreen() {
  const queryClient = useQueryClient();
  const isDemoMode = useDemoMode();
  const [demoProfileState, setDemoProfileState] = useState<Profile>(demoProfile);
  const [demoCycleState, setDemoCycleState] = useState(demoCycleSettings);

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: !isDemoMode
  });

  const cycleQuery = useQuery({
    queryKey: ["cycleSettings"],
    queryFn: getCycleSettings,
    enabled: !isDemoMode
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    }
  });

  const updateCycleMutation = useMutation({
    mutationFn: saveCycleSettings,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cycleSettings"] });
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

    const nextProfile: Profile = {
      ...demoProfileState,
      ...input,
      updated_at: new Date().toISOString()
    };
    setDemoProfileState(nextProfile);
    return nextProfile;
  }

  async function updateCycleSettingsAction(input: SaveCycleSettingsInput) {
    if (!isDemoMode) {
      return updateCycleMutation.mutateAsync(input);
    }

    const nextCycleSettings = {
      ...demoCycleState,
      ...input,
      updated_at: new Date().toISOString()
    };
    setDemoCycleState(nextCycleSettings);
    return nextCycleSettings;
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

  return {
    profile: isDemoMode ? demoProfileState : profileQuery.data,
    cycleSettings: isDemoMode ? demoCycleState : cycleQuery.data,
    loading: !isDemoMode && (profileQuery.isLoading || cycleQuery.isLoading),
    updateProfile: updateProfileAction,
    updateCycleSettings: updateCycleSettingsAction,
    restorePurchases: restorePurchasesAction,
    openCustomerCenter: openCustomerCenterAction,
    deleteAccount: deleteAccountAction,
    restoring: !isDemoMode && restoreMutation.isPending,
    openingCustomerCenter: !isDemoMode && customerCenterMutation.isPending,
    deletingAccount: !isDemoMode && accountDeleteMutation.isPending
  };
}
