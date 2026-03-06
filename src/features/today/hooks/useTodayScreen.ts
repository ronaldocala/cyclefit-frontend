import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { useCyclePhase } from "@/features/cycle/hooks/useCyclePhase";
import { demoCycleSettings } from "@/services/demo/demoData";
import { getCycleSettings } from "@/services/supabase/cycleService";
import { useAppStore } from "@/store/appStore";
import { useDemoMode } from "@/utils/demoMode";

const recommendations = {
  menstrual: {
    title: "Cycle Reset Flow",
    durationMinutes: 25,
    workoutDescription: "Keep intensity low and prioritize gentle movement, breathing, and recovery-focused mobility work.",
    alternateWorkouts: ["Gentle Mobility Circuit", "Light Core Stability"],
    premiumWorkoutId: "demo-premium-menstrual-1",
    nutritionSuggestion: "Iron-rich foods + vitamin C",
    sleepGoal: "8h 45m suggested",
    freeActions: ["Build your workout", "Explore exercises"],
    premiumAction: "Start today's workout"
  },
  follicular: {
    title: "Progressive Strength Ladder",
    durationMinutes: 40,
    workoutDescription: "Energy is rising, so this is a strong window for progressive overload and compound strength sessions.",
    alternateWorkouts: ["Lower Body Strength Focus", "Upper Push-Pull Builder"],
    premiumWorkoutId: "demo-premium-follicular-1",
    nutritionSuggestion: "Lean protein and complex carbs",
    sleepGoal: "8h 00m suggested",
    freeActions: ["Build your workout", "Explore exercises"],
    premiumAction: "Start today's workout"
  },
  ovulation: {
    title: "Peak Power Intervals",
    durationMinutes: 35,
    workoutDescription: "Use this phase for higher output intervals, power work, and faster-paced training blocks.",
    alternateWorkouts: ["Explosive Sprint Set", "HIIT Power Builder"],
    premiumWorkoutId: "demo-premium-ovulation-1",
    nutritionSuggestion: "Hydration + antioxidant foods",
    sleepGoal: "7h 45m suggested",
    freeActions: ["Build your workout", "Explore exercises"],
    premiumAction: "Start today's workout"
  },
  luteal: {
    title: "Steady Engine Builder",
    durationMinutes: 30,
    workoutDescription: "Focus on steady efforts, moderate loads, and extra recovery support to stay consistent.",
    alternateWorkouts: ["Zone 2 Endurance Ride", "Moderate Tempo Intervals"],
    premiumWorkoutId: "demo-premium-luteal-1",
    nutritionSuggestion: "Magnesium-rich foods + fiber",
    sleepGoal: "8h 30m suggested",
    freeActions: ["Build your workout", "Explore exercises"],
    premiumAction: "Start today's workout"
  }
} as const;

export function useTodayScreen() {
  const isPremium = useAppStore((state) => state.isPremium);
  const isDemoMode = useDemoMode();

  const cycleQuery = useQuery({
    queryKey: ["cycleSettings"],
    queryFn: getCycleSettings,
    enabled: !isDemoMode
  });

  const cycleSettings = isDemoMode ? demoCycleSettings : (cycleQuery.data ?? null);
  const cycleSummary = useCyclePhase(cycleSettings);

  const recommendation = useMemo(() => {
    if (!cycleSummary) {
      return null;
    }

    return recommendations[cycleSummary.phase];
  }, [cycleSummary]);

  return {
    isPremium,
    cycleSummary,
    recommendation,
    loading: !isDemoMode && cycleQuery.isLoading,
    isDemoMode
  };
}
