import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { useCyclePhase } from "@/features/cycle/hooks/useCyclePhase";
import { demoWorkoutSessions } from "@/services/demo/demoData";
import { getCycleSettingsState } from "@/services/supabase/cycleService";
import { listWorkoutSessions } from "@/services/supabase/sessionsService";
import { useDemoStore } from "@/store/demoStore";
import { useDemoMode } from "@/utils/demoMode";

export function useProgressScreen() {
  const isDemoMode = useDemoMode();
  const demoCycleSettings = useDemoStore((state) => state.cycleState.settings);

  const sessionsQuery = useQuery({
    queryKey: ["workoutSessions"],
    queryFn: () => listWorkoutSessions(100),
    enabled: !isDemoMode
  });

  const cycleQuery = useQuery({
    queryKey: ["cycleSettings"],
    queryFn: getCycleSettingsState,
    enabled: !isDemoMode
  });

  const sessions = isDemoMode ? demoWorkoutSessions : (sessionsQuery.data ?? []);
  const cycleSettings = isDemoMode ? demoCycleSettings : (cycleQuery.data?.settings ?? null);
  const cycleSummary = useCyclePhase(cycleSettings);

  const stats = useMemo(() => {
    const completed = sessions.filter((session) => session.status === "completed");
    const totalMinutes = completed.reduce((total, session) => total + Math.round((session.duration_seconds ?? 0) / 60), 0);
    const weeklyTrend = completed.slice(0, 7).map((session) => Math.round((session.duration_seconds ?? 0) / 60));

    return {
      completedWorkouts: completed.length,
      totalMinutes,
      weeklyTrend
    };
  }, [sessions]);

  return {
    loading: !isDemoMode && (sessionsQuery.isLoading || cycleQuery.isLoading),
    cycleSummary,
    sessions,
    stats
  };
}
