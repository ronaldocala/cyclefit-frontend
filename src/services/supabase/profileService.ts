import type { Profile } from "@/api/types";
import { supabase } from "@/services/supabase/client";
import { AppError } from "@/utils/errors";

export async function getProfile(): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").maybeSingle<Profile>();

  if (error) {
    throw new AppError("profile_fetch_error", error.message);
  }

  return data;
}

export async function updateProfile(input: Partial<Omit<Profile, "user_id" | "created_at" | "updated_at">>): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update(input)
    .select("*")
    .single<Profile>();

  if (error) {
    throw new AppError("profile_update_error", error.message);
  }

  return data;
}
