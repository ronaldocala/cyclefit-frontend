import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { demoWorkoutSessions } from "@/services/demo/demoData";
import { listWorkoutSessions } from "@/services/supabase/sessionsService";
import { useDemoMode } from "@/utils/demoMode";

export function useProgressScreen() {
  const isDemoMode = useDemoMode();

  const sessionsQuery = useQuery({
    queryKey: ["workoutSessions"],
    queryFn: () => listWorkoutSessions(100),
    enabled: !isDemoMode
  });

  const sessions = isDemoMode ? demoWorkoutSessions : (sessionsQuery.data ?? []);

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
    loading: !isDemoMode && sessionsQuery.isLoading,
    sessions,
    stats
  };
}
