import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getCycleSettings, saveCycleSettings } from "@/services/supabase/cycleService";
import { deleteAccount } from "@/services/supabase/premiumService";
import { getProfile, updateProfile } from "@/services/supabase/profileService";
import { restorePurchases } from "@/services/revenuecat/revenueCatService";

export function useSettingsScreen() {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile
  });

  const cycleQuery = useQuery({
    queryKey: ["cycleSettings"],
    queryFn: getCycleSettings
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

  const accountDeleteMutation = useMutation({
    mutationFn: deleteAccount
  });

  return {
    profile: profileQuery.data,
    cycleSettings: cycleQuery.data,
    loading: profileQuery.isLoading || cycleQuery.isLoading,
    updateProfile: updateProfileMutation.mutateAsync,
    updateCycleSettings: updateCycleMutation.mutateAsync,
    restorePurchases: restoreMutation.mutateAsync,
    deleteAccount: accountDeleteMutation.mutateAsync,
    restoring: restoreMutation.isPending,
    deletingAccount: accountDeleteMutation.isPending
  };
}
