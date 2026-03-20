import type { Profile } from "@/api/types";
import { getRequiredUserId } from "@/services/supabase/authHelpers";
import { supabase } from "@/services/supabase/client";
import { AppError } from "@/utils/errors";

type UpdatableProfileFields = Partial<Omit<Profile, "user_id" | "created_at" | "updated_at">>;

function resolveLocalTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export async function getProfile(): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").maybeSingle<Profile>();

  if (error) {
    throw new AppError("profile_fetch_error", error.message);
  }

  return data;
}

export async function updateProfile(input: UpdatableProfileFields): Promise<Profile> {
  const userId = await getRequiredUserId();
  const currentProfile = await getProfile();
  const payload = {
    user_id: userId,
    display_name: input.display_name ?? currentProfile?.display_name ?? null,
    units: input.units ?? currentProfile?.units ?? "metric",
    goal: input.goal ?? currentProfile?.goal ?? null,
    fitness_level: input.fitness_level ?? currentProfile?.fitness_level ?? "beginner",
    timezone: input.timezone ?? currentProfile?.timezone ?? resolveLocalTimezone(),
    last_seen_phase: input.last_seen_phase ?? currentProfile?.last_seen_phase ?? null
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single<Profile>();

  if (error) {
    throw new AppError("profile_update_error", error.message);
  }

  return data;
}
