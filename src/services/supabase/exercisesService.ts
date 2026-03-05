import type { Exercise } from "@/api/types";
import { supabase } from "@/services/supabase/client";
import { AppError } from "@/utils/errors";

export async function listExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true })
    .returns<Exercise[]>();

  if (error) {
    throw new AppError("exercises_list_error", error.message);
  }

  return data ?? [];
}
