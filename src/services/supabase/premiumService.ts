import type { EntitlementStatus, PremiumPlan, PremiumWorkout } from "@/api/types";
import { supabase } from "@/services/supabase/client";
import { AppError } from "@/utils/errors";

export async function getEntitlementStatus(): Promise<EntitlementStatus> {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new AppError("entitlement_no_session", "Missing auth session");
  }

  const { data, error } = await supabase.functions.invoke<EntitlementStatus>("entitlement_check", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${session.access_token}`
    }
  });

  if (error || !data) {
    throw new AppError("entitlement_check_error", error?.message ?? "No entitlement response");
  }

  return data;
}

export async function listPremiumWorkouts(): Promise<PremiumWorkout[]> {
  const { data, error } = await supabase
    .from("premium_workouts")
    .select("*")
    .eq("is_published", true)
    .returns<PremiumWorkout[]>();

  if (error) {
    throw new AppError("premium_workouts_list_error", error.message);
  }

  return data ?? [];
}

export async function listPremiumPlans(): Promise<PremiumPlan[]> {
  const { data, error } = await supabase
    .from("premium_plans")
    .select("*")
    .eq("is_published", true)
    .returns<PremiumPlan[]>();

  if (error) {
    throw new AppError("premium_plans_list_error", error.message);
  }

  return data ?? [];
}

export async function deleteAccount(): Promise<void> {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new AppError("account_delete_no_session", "Missing auth session");
  }

  const { error } = await supabase.functions.invoke("account_delete", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${session.access_token}`
    }
  });

  if (error) {
    throw new AppError("account_delete_error", error.message);
  }
}
