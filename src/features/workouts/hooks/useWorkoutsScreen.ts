import { useQuery } from "@tanstack/react-query";

import { listPremiumWorkouts } from "@/services/supabase/premiumService";
import { listUserWorkouts } from "@/services/supabase/workoutsService";
import { useAppStore } from "@/store/appStore";

export function useWorkoutsScreen() {
  const isPremium = useAppStore((state) => state.isPremium);

  const userWorkoutsQuery = useQuery({
    queryKey: ["userWorkouts"],
    queryFn: listUserWorkouts
  });

  const premiumWorkoutsQuery = useQuery({
    queryKey: ["premiumWorkouts"],
    queryFn: listPremiumWorkouts,
    enabled: isPremium
  });

  return {
    isPremium,
    userWorkouts: userWorkoutsQuery.data ?? [],
    premiumWorkouts: premiumWorkoutsQuery.data ?? [],
    loading: userWorkoutsQuery.isLoading || premiumWorkoutsQuery.isLoading
  };
}
