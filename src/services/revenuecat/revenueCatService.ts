import { asyncStorageService } from "@/services/storage/asyncStorage";
import { trackEvent } from "@/services/telemetry/analytics";
import { logger } from "@/services/telemetry/logger";
import { useAppStore } from "@/store/appStore";
import { premiumCacheTtlMs, storageKeys } from "@/utils/constants";
import { isDemoModeEnabled } from "@/utils/demoMode";

export type PremiumState = "loading" | "active" | "expired" | "unknown" | "error";

export const CYCLEFIT_PRO_ENTITLEMENT_ID = "premium";
export const CYCLEFIT_MONTHLY_PACKAGE_ID = "monthly";
export const CYCLEFIT_YEARLY_PACKAGE_ID = "yearly";
export const CYCLEFIT_LIFETIME_PACKAGE_ID = "lifetime";

export type PurchasesPackage = {
  identifier: string;
  packageType?: string;
};

export type PaywallResult = string | number;

export type RevenueCatPlans = {
  monthly: PurchasesPackage | null;
  yearly: PurchasesPackage | null;
  lifetime: PurchasesPackage | null;
};

type PremiumCache = {
  isPremium: boolean;
  updatedAtIso: string;
};

const disabledPaywallResult = {
  NOT_PRESENTED: "NOT_PRESENTED",
  ERROR: "ERROR"
} as const;

let didLogDisabledWarning = false;

function logRevenueCatDisabled(context: string): void {
  if (didLogDisabledWarning) {
    logger.info("RevenueCat integration remains disabled", { context });
    return;
  }

  didLogDisabledWarning = true;
  logger.warn("RevenueCat integration disabled for stability while diagnosing iOS startup crash", {
    context
  });
}

async function savePremiumCache(isPremium: boolean): Promise<void> {
  await asyncStorageService.set<PremiumCache>(storageKeys.premiumCache, {
    isPremium,
    updatedAtIso: new Date().toISOString()
  });
}

async function activateDemoPremium(): Promise<void> {
  await savePremiumCache(true);
  useAppStore.getState().setPremium(true, "active");
}

async function setPremiumDisabledState(): Promise<void> {
  await savePremiumCache(false);
  useAppStore.getState().setPremium(false, "unknown");
}

export function isCycleFitProActive(): boolean {
  return false;
}

export async function readCachedPremium(): Promise<boolean | null> {
  const cache = await asyncStorageService.get<PremiumCache>(storageKeys.premiumCache);
  if (!cache) {
    return null;
  }

  const ageMs = Date.now() - new Date(cache.updatedAtIso).getTime();
  if (ageMs > premiumCacheTtlMs) {
    return null;
  }

  return cache.isPremium;
}

export async function configureRevenueCat(_appUserId: string): Promise<void> {
  if (isDemoModeEnabled()) {
    await activateDemoPremium();
    return;
  }

  logRevenueCatDisabled("configure");
  await setPremiumDisabledState();
}

export async function resetRevenueCatUser(): Promise<void> {
  if (isDemoModeEnabled()) {
    return;
  }

  logRevenueCatDisabled("reset");
}

export async function refreshPremiumFromRevenueCat(): Promise<{ isPremium: boolean; state: PremiumState }> {
  if (isDemoModeEnabled()) {
    await activateDemoPremium();
    return {
      isPremium: true,
      state: "active"
    };
  }

  logRevenueCatDisabled("refresh");
  await setPremiumDisabledState();

  return {
    isPremium: false,
    state: "unknown"
  };
}

export async function purchasePremiumPackage(_packageToBuy: PurchasesPackage): Promise<{ success: boolean; cancelled: boolean }> {
  if (isDemoModeEnabled()) {
    await activateDemoPremium();
    trackEvent("purchase_result", { result: "success_demo", atIso: new Date().toISOString() });
    return { success: true, cancelled: false };
  }

  logRevenueCatDisabled("purchase");
  trackEvent("purchase_result", { result: "fail_disabled", atIso: new Date().toISOString() });
  return { success: false, cancelled: false };
}

export async function restorePurchases(): Promise<boolean> {
  if (isDemoModeEnabled()) {
    await activateDemoPremium();
    trackEvent("restore_purchases_result", {
      result: "success_demo",
      atIso: new Date().toISOString()
    });
    return true;
  }

  logRevenueCatDisabled("restore");
  trackEvent("restore_purchases_result", {
    result: "fail_disabled",
    atIso: new Date().toISOString()
  });
  return false;
}

export async function listRevenueCatPackages(): Promise<PurchasesPackage[]> {
  logRevenueCatDisabled("list_packages");
  return [];
}

export async function getCycleFitPlans(): Promise<RevenueCatPlans> {
  logRevenueCatDisabled("plans");
  return {
    monthly: null,
    yearly: null,
    lifetime: null
  };
}

export async function presentCycleFitProPaywallIfNeeded(): Promise<{ success: boolean; result: PaywallResult }> {
  if (isDemoModeEnabled()) {
    await activateDemoPremium();
    return {
      success: true,
      result: disabledPaywallResult.NOT_PRESENTED
    };
  }

  logRevenueCatDisabled("paywall_if_needed");
  return {
    success: false,
    result: disabledPaywallResult.ERROR
  };
}

export async function presentCycleFitProPaywall(): Promise<{ success: boolean; result: PaywallResult }> {
  if (isDemoModeEnabled()) {
    await activateDemoPremium();
    return {
      success: true,
      result: disabledPaywallResult.NOT_PRESENTED
    };
  }

  logRevenueCatDisabled("paywall");
  trackEvent("paywall_viewed", { source: "revenuecat_disabled", atIso: new Date().toISOString() });
  return {
    success: false,
    result: disabledPaywallResult.ERROR
  };
}

export async function openCustomerCenter(): Promise<boolean> {
  if (isDemoModeEnabled()) {
    return true;
  }

  logRevenueCatDisabled("customer_center");
  return false;
}
