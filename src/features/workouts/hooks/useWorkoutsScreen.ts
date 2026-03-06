import { useQuery } from "@tanstack/react-query";

import { demoPremiumWorkouts, demoUserWorkouts } from "@/services/demo/demoData";
import { listPremiumWorkouts } from "@/services/supabase/premiumService";
import { listUserWorkouts } from "@/services/supabase/workoutsService";
import { useAppStore } from "@/store/appStore";
import { useDemoMode } from "@/utils/demoMode";

export function useWorkoutsScreen() {
  const isPremium = useAppStore((state) => state.isPremium);
  const isDemoMode = useDemoMode();

  const userWorkoutsQuery = useQuery({
    queryKey: ["userWorkouts"],
    queryFn: listUserWorkouts,
    enabled: !isDemoMode
  });

  const premiumWorkoutsQuery = useQuery({
    queryKey: ["premiumWorkouts"],
    queryFn: listPremiumWorkouts,
    enabled: !isDemoMode && isPremium
  });

  const userWorkouts = isDemoMode ? demoUserWorkouts : (userWorkoutsQuery.data ?? []);
  const premiumWorkouts = isDemoMode ? demoPremiumWorkouts : (premiumWorkoutsQuery.data ?? []);

  return {
    isPremium,
    userWorkouts,
    premiumWorkouts,
    loading: !isDemoMode && (userWorkoutsQuery.isLoading || premiumWorkoutsQuery.isLoading)
  };
}
