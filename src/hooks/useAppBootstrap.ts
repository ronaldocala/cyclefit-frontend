import { useEffect } from "react";

import { configureRevenueCat } from "@/services/revenuecat/revenueCatService";
import { asyncStorageService } from "@/services/storage/asyncStorage";
import { supabase } from "@/services/supabase/client";
import { syncOfflineQueue } from "@/services/sync/offlineQueue";
import { logger } from "@/services/telemetry/logger";
import { initSentry } from "@/services/telemetry/sentry";
import { useAppStore } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";
import { storageKeys, type CyclePhase } from "@/utils/constants";

let sentryInitialized = false;

export function useAppBootstrap(): void {
  const setSession = useAuthStore((state) => state.setSession);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setPhaseOverride = useAppStore((state) => state.setPhaseOverride);
  const phaseOverride = useAppStore((state) => state.phaseOverride);

  useEffect(() => {
    if (!sentryInitialized) {
      initSentry();
      sentryInitialized = true;
    }

    void syncOfflineQueue();

    async function initAuth(): Promise<void> {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      setSession(session);
      setLoading(false);

      if (session?.user.id) {
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
        void configureRevenueCat(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setLoading, setSession]);

  useEffect(() => {
    async function hydratePhaseOverride(): Promise<void> {
      const saved = await asyncStorageService.get<CyclePhase | null>(storageKeys.phaseOverride);
      setPhaseOverride(saved ?? null);
    }

    void hydratePhaseOverride();
  }, [setPhaseOverride]);

  useEffect(() => {
    void asyncStorageService.set(storageKeys.phaseOverride, phaseOverride);
  }, [phaseOverride]);
}
