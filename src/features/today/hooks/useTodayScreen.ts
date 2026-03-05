import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { useCyclePhase } from "@/features/cycle/hooks/useCyclePhase";
import { getCycleSettings } from "@/services/supabase/cycleService";
import { useAppStore } from "@/store/appStore";

const recommendations = {
  menstrual: {
    title: "Mobility and Recovery",
    freeActions: ["Build your workout", "Explore exercises"],
    premiumAction: "Start today's workout"
  },
  follicular: {
    title: "Strength Training",
    freeActions: ["Build your workout", "Explore exercises"],
    premiumAction: "Start today's workout"
  },
  ovulation: {
    title: "Power Intervals",
    freeActions: ["Build your workout", "Explore exercises"],
    premiumAction: "Start today's workout"
  },
  luteal: {
    title: "Steady Endurance",
    freeActions: ["Build your workout", "Explore exercises"],
    premiumAction: "Start today's workout"
  }
} as const;

export function useTodayScreen() {
  const isPremium = useAppStore((state) => state.isPremium);

  const cycleQuery = useQuery({
    queryKey: ["cycleSettings"],
    queryFn: getCycleSettings
  });

  const cycleSummary = useCyclePhase(cycleQuery.data ?? null);

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
    loading: cycleQuery.isLoading
  };
}
