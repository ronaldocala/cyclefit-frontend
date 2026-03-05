import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { listWorkoutSessions } from "@/services/supabase/sessionsService";

export function useProgressScreen() {
  const sessionsQuery = useQuery({
    queryKey: ["workoutSessions"],
    queryFn: () => listWorkoutSessions(100)
  });

  const stats = useMemo(() => {
    const sessions = sessionsQuery.data ?? [];
    const completed = sessions.filter((session) => session.status === "completed");
    const totalMinutes = completed.reduce((total, session) => total + Math.round((session.duration_seconds ?? 0) / 60), 0);
    const weeklyTrend = completed.slice(0, 7).map((session) => Math.round((session.duration_seconds ?? 0) / 60));

    return {
      completedWorkouts: completed.length,
      totalMinutes,
      weeklyTrend
    };
  }, [sessionsQuery.data]);

  return {
    loading: sessionsQuery.isLoading,
    sessions: sessionsQuery.data ?? [],
    stats
  };
}
