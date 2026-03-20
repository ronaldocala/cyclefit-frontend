import type { OnboardingPreferences } from "@/api/types";
import { getRequiredUserId } from "@/services/supabase/authHelpers";
import { supabase } from "@/services/supabase/client";
import { AppError } from "@/utils/errors";

export type SaveOnboardingPreferencesInput = Pick<
  OnboardingPreferences,
  "equipment_access" | "weekly_training_days" | "riding_environment" | "available_workout_time"
> & {
  onboarding_completed_at?: string | null;
};

export async function getOnboardingPreferences(): Promise<OnboardingPreferences | null> {
  const { data, error } = await supabase.from("onboarding_preferences").select("*").maybeSingle<OnboardingPreferences>();

  if (error) {
    throw new AppError("onboarding_preferences_fetch_error", error.message);
  }

  return data;
}

function isAvailableWorkoutTimeSchemaError(message: string): boolean {
  return (
    message.includes("available_workout_time") &&
    (message.includes("schema cache") || message.includes("Could not find the"))
  );
}

export async function saveOnboardingPreferences(input: SaveOnboardingPreferencesInput): Promise<OnboardingPreferences> {
  const userId = await getRequiredUserId();
  const payload = {
    user_id: userId,
    onboarding_completed_at: input.onboarding_completed_at ?? new Date().toISOString(),
    ...input
  };

  const { data, error } = await supabase
    .from("onboarding_preferences")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single<OnboardingPreferences>();

  if (error && isAvailableWorkoutTimeSchemaError(error.message)) {
    const fallbackPayload = {
      user_id: userId,
      onboarding_completed_at: payload.onboarding_completed_at,
      equipment_access: input.equipment_access,
      weekly_training_days: input.weekly_training_days,
      riding_environment: input.riding_environment
    };

    const fallbackResult = await supabase
      .from("onboarding_preferences")
      .upsert(fallbackPayload, { onConflict: "user_id" })
      .select("*")
      .single<OnboardingPreferences>();

    if (fallbackResult.error) {
      throw new AppError("onboarding_preferences_save_error", fallbackResult.error.message);
    }

    return {
      ...fallbackResult.data,
      available_workout_time: input.available_workout_time
    };
  }

  if (error) {
    throw new AppError("onboarding_preferences_save_error", error.message);
  }

  return data;
}
