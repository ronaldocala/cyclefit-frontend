import { useEffect } from "react";

import { supabase } from "@/services/supabase/client";
import { syncCycleSettings } from "@/services/supabase/cycleService";
import { syncDailyProgressLogs } from "@/services/supabase/dailyProgressLogService";
import { syncOfflineQueue } from "@/services/sync/offlineQueue";
import { logger } from "@/services/telemetry/logger";
import { captureException, initSentry } from "@/services/telemetry/sentry";
import { useAuthStore } from "@/store/authStore";
import { env, hasRequiredRuntimeConfig, missingRuntimeConfigKeys } from "@/utils/env";
import { parseUnknownError } from "@/utils/errors";

let sentryInitialized = false;

export function useAppBootstrap(): void {
  const setSession = useAuthStore((state) => state.setSession);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setDevSkipLogin = useAuthStore((state) => state.setDevSkipLogin);
  const setBootstrapError = useAuthStore((state) => state.setBootstrapError);

  useEffect(() => {
    if (!sentryInitialized) {
      initSentry();
      sentryInitialized = true;
    }

    if (!hasRequiredRuntimeConfig) {
      const message = `Missing required app configuration: ${missingRuntimeConfigKeys.join(", ")}.`;
      logger.error(message);
      setBootstrapError(message);
      setLoading(false);
      return;
    }

    setBootstrapError(null);

    if (env.demoMode) {
      setDevSkipLogin(true);
      return;
    }

    void syncOfflineQueue().catch((error) => {
      logger.warn("Offline queue sync failed during bootstrap", { error: String(error) });
    });
    void syncCycleSettings().catch((error) => {
      logger.warn("Cycle settings sync failed during bootstrap", { error: String(error) });
    });
    void syncDailyProgressLogs().catch((error) => {
      logger.warn("Daily progress sync failed during bootstrap", { error: String(error) });
    });

    async function initAuth(): Promise<void> {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        setSession(session);

        if (session?.user.id) {
          void syncCycleSettings().catch((error) => {
            logger.warn("Cycle settings sync failed after session restore", { error: String(error) });
          });
          void syncDailyProgressLogs().catch((error) => {
            logger.warn("Daily progress sync failed after session restore", { error: String(error) });
          });

        }
      } catch (error) {
        const parsedError = parseUnknownError(error, "app_bootstrap_failed");
        logger.error("App bootstrap failed", {
          code: parsedError.code,
          error: parsedError.message
        });
        captureException(error);
        setBootstrapError(parsedError.message);
      } finally {
        setLoading(false);
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
        void syncCycleSettings().catch((error) => {
          logger.warn("Cycle settings sync failed after auth state change", { error: String(error) });
        });
        void syncDailyProgressLogs().catch((error) => {
          logger.warn("Daily progress sync failed after auth state change", { error: String(error) });
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setBootstrapError, setDevSkipLogin, setLoading, setSession]);
}
