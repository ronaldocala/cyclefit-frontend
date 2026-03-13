import { useEffect } from "react";

import { configureRevenueCat } from "@/services/revenuecat/revenueCatService";
import { supabase } from "@/services/supabase/client";
import { syncCycleSettings } from "@/services/supabase/cycleService";
import { syncDailyProgressLogs } from "@/services/supabase/dailyProgressLogService";
import { syncOfflineQueue } from "@/services/sync/offlineQueue";
import { logger } from "@/services/telemetry/logger";
import { initSentry } from "@/services/telemetry/sentry";
import { useAuthStore } from "@/store/authStore";
import { env } from "@/utils/env";

let sentryInitialized = false;

export function useAppBootstrap(): void {
  const setSession = useAuthStore((state) => state.setSession);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setDevSkipLogin = useAuthStore((state) => state.setDevSkipLogin);

  useEffect(() => {
    if (!sentryInitialized) {
      initSentry();
      sentryInitialized = true;
    }

    if (env.demoMode) {
      setDevSkipLogin(true);
      return;
    }

    void syncOfflineQueue();
    void syncCycleSettings();
    void syncDailyProgressLogs();

    async function initAuth(): Promise<void> {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      setSession(session);
      setLoading(false);

      if (session?.user.id) {
        void syncCycleSettings();
        void syncDailyProgressLogs();
        await configureRevenueCat(session.user.id);
      }
    }

    void initAuth();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      logger.info("Auth state changed", {
        eventAtIso: new Date().toISOString(),
        userId: session?.user.id ?? null
      });

      setSession(session);

      if (session?.user.id) {
        void syncCycleSettings();
        void syncDailyProgressLogs();
        void configureRevenueCat(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setDevSkipLogin, setLoading, setSession]);
}
