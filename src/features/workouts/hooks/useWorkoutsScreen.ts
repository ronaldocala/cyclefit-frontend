import { useEffect, useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import type { FitnessLevel } from "@/api/types";
import { useCyclePhase } from "@/features/cycle/hooks/useCyclePhase";
import {
  referenceWorkouts,
  type WorkoutEnvironment,
  type WorkoutIntensity,
  type WorkoutLength
} from "@/features/workouts/data/referenceWorkoutsCatalog";
import { demoPremiumWorkouts, demoUserWorkouts } from "@/services/demo/demoData";
import { listPremiumWorkouts } from "@/services/supabase/premiumService";
import { getCycleSettingsState } from "@/services/supabase/cycleService";
import { getProfile } from "@/services/supabase/profileService";
import { listUserWorkouts } from "@/services/supabase/workoutsService";
import { asyncStorageService } from "@/services/storage/asyncStorage";
import { useAppStore } from "@/store/appStore";
import { useDemoStore } from "@/store/demoStore";
import { useDemoMode } from "@/utils/demoMode";
import type { CyclePhase } from "@/utils/constants";

type WorkoutEnvironmentFilter = "all" | WorkoutEnvironment;
type WorkoutLengthFilter = "all" | WorkoutLength;
type WorkoutIntensityFilter = "all" | WorkoutIntensity;
type WorkoutPhaseFilter = "all" | CyclePhase;

export type WorkoutBrowseFilters = {
  phase: WorkoutPhaseFilter;
  experience: FitnessLevel;
  environment: WorkoutEnvironmentFilter;
  length: WorkoutLengthFilter;
  intensity: WorkoutIntensityFilter;
};

const WORKOUT_FILTERS_STORAGE_KEY = "workouts:browseFilters:v1";

const DEFAULT_FILTERS: WorkoutBrowseFilters = {
  phase: "all",
  experience: "beginner",
  environment: "all",
  length: "all",
  intensity: "all"
};

export function useWorkoutsScreen() {
  const isPremium = useAppStore((state) => state.isPremium);
  const isDemoMode = useDemoMode();
  const demoProfile = useDemoStore((state) => state.profile);
  const demoCycleState = useDemoStore((state) => state.cycleState);
  const [filters, setFilters] = useState<WorkoutBrowseFilters | null>(null);

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

  const profileExperience = (isDemoMode ? demoProfile.fitness_level : profileQuery.data?.fitness_level) ?? DEFAULT_FILTERS.experience;
  const cycleSettings = isDemoMode ? demoCycleState.settings : (cycleQuery.data?.settings ?? null);
  const cycleSummary = useCyclePhase(cycleSettings);
  const currentPhase = cycleSummary?.phase ?? "menstrual";

  useEffect(() => {
    if (filters !== null) {
      return;
    }

    if (!isDemoMode && (profileQuery.isLoading || cycleQuery.isLoading)) {
      return;
    }

    let isMounted = true;

    async function loadFilters() {
      const storedFilters = await asyncStorageService.get<Partial<WorkoutBrowseFilters>>(WORKOUT_FILTERS_STORAGE_KEY);
      if (!isMounted) {
        return;
      }

      setFilters({
        ...DEFAULT_FILTERS,
        phase: currentPhase,
        experience: profileExperience,
        ...storedFilters
      });
    }

    void loadFilters();

    return () => {
      isMounted = false;
    };
  }, [currentPhase, cycleQuery.isLoading, filters, isDemoMode, profileExperience, profileQuery.isLoading]);

  function persistFilters(nextFilters: WorkoutBrowseFilters) {
    setFilters(nextFilters);
    void asyncStorageService.set(WORKOUT_FILTERS_STORAGE_KEY, nextFilters);
  }

  function updateFilters(patch: Partial<WorkoutBrowseFilters>) {
    if (!filters) {
      return;
    }

    persistFilters({
      ...filters,
      ...patch
    });
  }

  function resetFilters() {
    persistFilters({
      ...DEFAULT_FILTERS,
      phase: currentPhase,
      experience: profileExperience
    });
  }

  const filteredReferenceWorkouts = useMemo(() => {
    if (!filters) {
      return [];
    }

    return referenceWorkouts.filter((workout) => {
      if (filters.phase !== "all" && workout.phase !== filters.phase) {
        return false;
      }

      if (workout.level !== filters.experience) {
        return false;
      }

      if (filters.environment !== "all" && workout.environment !== filters.environment) {
        return false;
      }

      if (filters.length !== "all" && workout.length !== filters.length) {
        return false;
      }

      if (filters.intensity !== "all" && workout.intensity !== filters.intensity) {
        return false;
      }

      return true;
    });
  }, [filters]);

  const userWorkouts = isDemoMode ? demoUserWorkouts : (userWorkoutsQuery.data ?? []);
  const premiumWorkouts = isDemoMode ? demoPremiumWorkouts : (premiumWorkoutsQuery.data ?? []);

  return {
    isPremium,
    filters,
    currentPhase,
    profileExperience,
    userWorkouts,
    premiumWorkouts,
    referenceWorkouts,
    filteredReferenceWorkouts,
    updateFilters,
    resetFilters,
    loading:
      filters === null ||
      (!isDemoMode && (profileQuery.isLoading || cycleQuery.isLoading || userWorkoutsQuery.isLoading || premiumWorkoutsQuery.isLoading))
  };
}
