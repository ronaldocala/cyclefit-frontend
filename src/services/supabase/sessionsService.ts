import type { WorkoutSession } from "@/api/types";
import { getRequiredUserId } from "@/services/supabase/authHelpers";
import { supabase } from "@/services/supabase/client";
import { AppError } from "@/utils/errors";

export type SaveSessionInput = {
  source_type: "user_workout" | "premium_workout" | "quick_log";
  source_id?: string;
  user_workout_id?: string;
  started_at: string;
  completed_at: string;
  duration_seconds: number;
  rpe?: number;
  notes?: string;
};

export async function listWorkoutSessions(limit = 50): Promise<WorkoutSession[]> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit)
    .returns<WorkoutSession[]>();

  if (error) {
    throw new AppError("sessions_list_error", error.message);
  }

  return data ?? [];
}

export async function createCompletedSession(input: SaveSessionInput): Promise<WorkoutSession> {
  const userId = await getRequiredUserId();
  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: userId,
      user_workout_id: input.user_workout_id ?? null,
      source_type: input.source_type,
      source_id: input.source_id ?? null,
      status: "completed",
      started_at: input.started_at,
      completed_at: input.completed_at,
      duration_seconds: input.duration_seconds,
      rpe: input.rpe ?? null,
      notes: input.notes ?? null
    })
    .select("*")
    .single<WorkoutSession>();

  if (error) {
    throw new AppError("session_create_error", error.message);
  }

  return data;
}
