import { useEffect, useMemo, useRef, useState } from "react";

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
import { getOnboardingPreferences } from "@/services/supabase/onboardingService";
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
  const demoOnboardingPreferences = useDemoStore((state) => state.onboardingPreferences);
  const [filters, setFilters] = useState<WorkoutBrowseFilters | null>(null);
  const previousProfileExperienceRef = useRef<FitnessLevel>(DEFAULT_FILTERS.experience);
  const previousPreferredWorkoutLengthRef = useRef<WorkoutLengthFilter>(DEFAULT_FILTERS.length);

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
  const preferredWorkoutLength =
    (isDemoMode ? demoOnboardingPreferences.available_workout_time : onboardingPreferencesQuery.data?.available_workout_time) ??
    DEFAULT_FILTERS.length;
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

      const { experience: _storedExperience, length: _storedLength, ...storedIndependentFilters } = storedFilters ?? {};

      setFilters({
        ...DEFAULT_FILTERS,
        phase: currentPhase,
        experience: profileExperience,
        length: preferredWorkoutLength,
        ...storedIndependentFilters
      });
    }

    void loadFilters();

    return () => {
      isMounted = false;
    };
  }, [currentPhase, cycleQuery.isLoading, filters, isDemoMode, onboardingPreferencesQuery.isLoading, preferredWorkoutLength, profileExperience, profileQuery.isLoading]);

  useEffect(() => {
    if (!filters) {
      previousProfileExperienceRef.current = profileExperience;
      previousPreferredWorkoutLengthRef.current = preferredWorkoutLength;
      return;
    }

    const previousProfileExperience = previousProfileExperienceRef.current;
    const previousPreferredWorkoutLength = previousPreferredWorkoutLengthRef.current;
    const nextPatch: Partial<WorkoutBrowseFilters> = {};

    if (profileExperience !== previousProfileExperience && filters.experience === previousProfileExperience) {
      nextPatch.experience = profileExperience;
    }

    if (preferredWorkoutLength !== previousPreferredWorkoutLength && filters.length === previousPreferredWorkoutLength) {
      nextPatch.length = preferredWorkoutLength;
    }

    previousProfileExperienceRef.current = profileExperience;
    previousPreferredWorkoutLengthRef.current = preferredWorkoutLength;

    if (Object.keys(nextPatch).length > 0) {
      persistFilters({
        ...filters,
        ...nextPatch
      });
    }
  }, [filters, preferredWorkoutLength, profileExperience]);

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
      experience: profileExperience,
      length: preferredWorkoutLength
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
    preferredWorkoutLength,
    userWorkouts,
    premiumWorkouts,
    referenceWorkouts,
    filteredReferenceWorkouts,
    updateFilters,
    resetFilters,
    loading:
      filters === null ||
      (!isDemoMode &&
        (profileQuery.isLoading ||
          cycleQuery.isLoading ||
          onboardingPreferencesQuery.isLoading ||
          userWorkoutsQuery.isLoading ||
          premiumWorkoutsQuery.isLoading))
  };
}
