import { useEffect, useMemo, useState } from "react";

import type { RootStackParamList } from "@/navigation/types";
import { saveSessionOfflineFirst } from "@/services/sync/offlineQueue";
import { trackEvent } from "@/services/telemetry/analytics";
import { useAppStore } from "@/store/appStore";

export function useWorkoutSession() {
  const activeWorkout = useAppStore((state) => state.activeWorkout);
  const startWorkoutSession = useAppStore((state) => state.startWorkoutSession);
  const clearWorkoutSession = useAppStore((state) => state.clearWorkoutSession);
  const startedAtIso = activeWorkout?.startedAtIso ?? null;

  const [tick, setTick] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!startedAtIso) {
      return;
    }

    const interval = setInterval(() => {
      setTick((value) => value + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [startedAtIso]);

  const durationSeconds = useMemo(() => {
    if (!startedAtIso) {
      return 0;
    }

    return Math.max(0, Math.round((Date.now() - new Date(startedAtIso).getTime()) / 1000));
  }, [startedAtIso, tick]);

  function startSession(input: { sourceType: RootStackParamList["WorkoutSession"]["sourceType"]; sourceId?: string }): void {
    const hasMatchingActiveSession =
      activeWorkout &&
      activeWorkout.sourceType === input.sourceType &&
      activeWorkout.sourceId === input.sourceId &&
      activeWorkout.startedAtIso;

    if (hasMatchingActiveSession) {
      return;
    }

    const now = new Date().toISOString();
    startWorkoutSession({
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      startedAtIso: now
    });
    trackEvent("workout_started", { startedAtIso: now, sourceType: input.sourceType, sourceId: input.sourceId });
  }

  async function completeSession(input: {
    sourceType: "user_workout" | "premium_workout" | "quick_log";
    sourceId?: string;
    userWorkoutId?: string;
    rpe?: number;
    notes?: string;
  }): Promise<"saved" | "queued"> {
    if (!startedAtIso) {
      return "queued";
    }

    setSaving(true);

    const completedAtIso = new Date().toISOString();
    const result = await saveSessionOfflineFirst({
      source_type: input.sourceType,
      source_id: input.sourceId,
      user_workout_id: input.userWorkoutId,
      started_at: startedAtIso,
      completed_at: completedAtIso,
      duration_seconds: Math.max(60, durationSeconds),
      rpe: input.rpe,
      notes: input.notes
    });

    trackEvent("workout_completed", {
      result,
      startedAtIso,
      completedAtIso
    });

    setSaving(false);
    clearWorkoutSession();
    setTick(0);

    return result;
  }

  return {
    startedAtIso,
    durationSeconds,
    saving,
    startSession,
    completeSession
  };
}
