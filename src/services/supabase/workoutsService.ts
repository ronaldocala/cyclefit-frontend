import type { UserWorkout } from "@/api/types";
import { supabase } from "@/services/supabase/client";
import { AppError } from "@/utils/errors";

export async function listUserWorkouts(): Promise<UserWorkout[]> {
  const { data, error } = await supabase
    .from("user_workouts")
    .select("*")
    .order("updated_at", { ascending: false })
    .returns<UserWorkout[]>();

  if (error) {
    throw new AppError("workouts_list_error", error.message);
  }

  return data ?? [];
}

export async function createUserWorkout(input: Pick<UserWorkout, "name" | "description" | "is_template">): Promise<UserWorkout> {
  const { data, error } = await supabase
    .from("user_workouts")
    .insert(input)
    .select("*")
    .single<UserWorkout>();

  if (error) {
    throw new AppError("workouts_create_error", error.message);
  }

  return data;
}
