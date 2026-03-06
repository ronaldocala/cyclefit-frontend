import { useAuthStore } from "@/store/authStore";
import { env } from "@/utils/env";

export function useDemoMode(): boolean {
  const devSkipLogin = useAuthStore((state) => state.devSkipLogin);
  return env.demoMode || devSkipLogin;
}

export function isDemoModeEnabled(): boolean {
  return env.demoMode || useAuthStore.getState().devSkipLogin;
}
