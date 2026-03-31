import { useEffect } from "react";

import { readCachedPremium } from "@/services/premium/premiumAccessService";
import { getEntitlementStatus } from "@/services/supabase/premiumService";
import { useAppStore } from "@/store/appStore";
import { useDemoMode } from "@/utils/demoMode";

export function usePremiumStatus(isAuthenticated: boolean): void {
  const setPremium = useAppStore((state) => state.setPremium);
  const isDemoMode = useDemoMode();

  useEffect(() => {
    let mounted = true;

    async function reconcilePremium(): Promise<void> {
      if (isDemoMode) {
        setPremium(true, "active");
        return;
      }

      if (!isAuthenticated) {
        setPremium(false, "unknown");
        return;
      }

      setPremium(false, "loading");

      const cached = await readCachedPremium();
      if (mounted && cached !== null) {
        setPremium(cached, cached ? "active" : "expired");
      }

      try {
        const entitlement = await getEntitlementStatus();
        if (!mounted) {
          return;
        }

        const isPremium = entitlement.is_active;
        setPremium(isPremium, isPremium ? "active" : "expired");
      } catch {
        if (mounted) {
          setPremium(false, "error");
        }
      }
    }

    void reconcilePremium();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, isDemoMode, setPremium]);
}
