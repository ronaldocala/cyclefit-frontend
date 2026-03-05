import { useMemo, useState } from "react";

import { saveSessionOfflineFirst } from "@/services/sync/offlineQueue";
import { trackEvent } from "@/services/telemetry/analytics";

export function useWorkoutSession() {
  const [startedAtIso, setStartedAtIso] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const durationSeconds = useMemo(() => {
    if (!startedAtIso) {
      return 0;
    }

    return Math.max(0, Math.round((Date.now() - new Date(startedAtIso).getTime()) / 1000));
  }, [startedAtIso]);

  function startSession(): void {
    const now = new Date().toISOString();
    setStartedAtIso(now);
    trackEvent("workout_started", { startedAtIso: now });
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
    setStartedAtIso(null);

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
