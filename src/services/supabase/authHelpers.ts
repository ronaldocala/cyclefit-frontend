import { supabase } from "@/services/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { AppError } from "@/utils/errors";

export async function getCurrentUserId(): Promise<string | null> {
  const storedSession = useAuthStore.getState().session;
  if (storedSession?.user.id) {
    return storedSession.user.id;
  }

  const {
    data: { session }
  } = await supabase.auth.getSession();

  return session?.user.id ?? null;
}

export async function getRequiredUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new AppError("auth_missing_user", "No authenticated user was available.");
  }

  return userId;
}
