import Constants from "expo-constants";
import { Platform } from "react-native";

import { asyncStorageService } from "@/services/storage/asyncStorage";
import { trackEvent } from "@/services/telemetry/analytics";
import { logger } from "@/services/telemetry/logger";
import { useAppStore } from "@/store/appStore";
import { premiumCacheTtlMs, storageKeys } from "@/utils/constants";
import { isDemoModeEnabled } from "@/utils/demoMode";
import { env } from "@/utils/env";

export type PremiumState = "loading" | "active" | "expired" | "unknown" | "error";

export const CYCLEFIT_PRO_ENTITLEMENT_ID = "premium";
export const CYCLEFIT_MONTHLY_PACKAGE_ID = "monthly";
export const CYCLEFIT_YEARLY_PACKAGE_ID = "yearly";
export const CYCLEFIT_LIFETIME_PACKAGE_ID = "lifetime";

export type PurchasesPackage = {
  identifier: string;
  packageType?: string;
};

type CustomerInfo = {
  entitlements: {
    active: Record<string, unknown>;
  };
};

type CustomerInfoUpdateListener = (customerInfo: CustomerInfo) => void;

type PurchasesError = {
  code?: unknown;
  userCancelled?: boolean;
};

export type PaywallResult = string | number;

export type RevenueCatPlans = {
  monthly: PurchasesPackage | null;
  yearly: PurchasesPackage | null;
  lifetime: PurchasesPackage | null;
};

type PurchasesModule = {
  PURCHASES_ERROR_CODE: {
    PURCHASE_CANCELLED_ERROR: unknown;
  };
  LOG_LEVEL: {
    DEBUG: unknown;
    INFO: unknown;
  };
  PACKAGE_TYPE: {
    MONTHLY: unknown;
    ANNUAL: unknown;
    LIFETIME: unknown;
  };
  setLogLevel: (level: unknown) => Promise<void> | void;
  isConfigured: () => Promise<boolean>;
  configure: (params: { apiKey: string; appUserID: string }) => void;
  logIn: (appUserId: string) => Promise<unknown>;
  getCustomerInfo: () => Promise<CustomerInfo>;
  addCustomerInfoUpdateListener: (listener: CustomerInfoUpdateListener) => void;
  removeCustomerInfoUpdateListener: (listener: CustomerInfoUpdateListener) => void;
  logOut: () => Promise<CustomerInfo>;
  purchasePackage: (packageToBuy: PurchasesPackage) => Promise<{ customerInfo: CustomerInfo }>;
  restorePurchases: () => Promise<CustomerInfo>;
  getOfferings: () => Promise<{ current?: { availablePackages?: PurchasesPackage[] } }>;
};

type RevenueCatUIModule = {
  presentPaywallIfNeeded: (params: { requiredEntitlementIdentifier: string }) => Promise<PaywallResult>;
  presentPaywall: () => Promise<PaywallResult>;
  presentCustomerCenter: () => Promise<void>;
};

type RevenueCatModules = {
  purchases: PurchasesModule;
  revenueCatUI: RevenueCatUIModule;
  paywallResult: {
    NOT_PRESENTED: PaywallResult;
    ERROR: PaywallResult;
  };
};

type PremiumCache = {
  isPremium: boolean;
  updatedAtIso: string;
};

const fallbackPaywallResult = {
  NOT_PRESENTED: "NOT_PRESENTED",
  ERROR: "ERROR"
} as const;

let customerInfoListener: CustomerInfoUpdateListener | null = null;
let cachedRevenueCatModules: RevenueCatModules | null = null;
let didResolveRevenueCatModules = false;

function isExpoGoRuntime(): boolean {
  return Constants.appOwnership === "expo";
}

async function getRevenueCatModules(): Promise<RevenueCatModules | null> {
  if (didResolveRevenueCatModules) {
    return cachedRevenueCatModules;
  }

  didResolveRevenueCatModules = true;

  if (isExpoGoRuntime()) {
    logger.warn("RevenueCat is unavailable in Expo Go. Use an iOS/Android development build.");
    cachedRevenueCatModules = null;
    return null;
  }

  try {
    const purchasesModule = (await import("react-native-purchases")) as unknown as {
      default?: PurchasesModule;
      PURCHASES_ERROR_CODE?: PurchasesModule["PURCHASES_ERROR_CODE"];
      LOG_LEVEL?: PurchasesModule["LOG_LEVEL"];
      PACKAGE_TYPE?: PurchasesModule["PACKAGE_TYPE"];
    };

    const purchases = (purchasesModule.default ?? purchasesModule) as PurchasesModule;

    const purchasesUiModule = (await import("react-native-purchases-ui")) as unknown as {
      default?: RevenueCatUIModule;
      PAYWALL_RESULT?: RevenueCatModules["paywallResult"];
    };

    const revenueCatUI = (purchasesUiModule.default ?? purchasesUiModule) as RevenueCatUIModule;
    const paywallResult = purchasesUiModule.PAYWALL_RESULT ?? fallbackPaywallResult;

    cachedRevenueCatModules = {
      purchases,
      revenueCatUI,
      paywallResult
    };

    return cachedRevenueCatModules;
  } catch (error) {
    logger.warn("RevenueCat native modules are unavailable", {
      error: String(error)
    });
    cachedRevenueCatModules = null;
    return null;
  }
}

function selectApiKey(): string {
  if (Platform.OS === "ios") {
    return env.revenueCatAppleApiKey;
  }
  return env.revenueCatGoogleApiKey;
}

function matchesCustomPackageIdentifier(pkg: PurchasesPackage, wantedId: string): boolean {
  const normalized = pkg.identifier.toLowerCase();
  if (normalized === wantedId) {
    return true;
  }

  if (wantedId === CYCLEFIT_YEARLY_PACKAGE_ID) {
    return normalized === "annual";
  }

  return false;
}

function isPurchaseCancelled(error: unknown, purchases: PurchasesModule): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as PurchasesError;
  if (maybeError.code === purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
    return true;
  }

  return maybeError.userCancelled === true;
}

export function isCycleFitProActive(customerInfo: CustomerInfo): boolean {
  return Boolean(customerInfo.entitlements.active[CYCLEFIT_PRO_ENTITLEMENT_ID]);
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

async function syncPremiumStoreFromCustomerInfo(customerInfo: CustomerInfo): Promise<boolean> {
  const isPremium = isCycleFitProActive(customerInfo);
  await savePremiumCache(isPremium);
  useAppStore.getState().setPremium(isPremium, isPremium ? "active" : "expired");
  return isPremium;
}

function installCustomerInfoListener(purchases: PurchasesModule): void {
  if (customerInfoListener) {
    return;
  }

  customerInfoListener = (customerInfo) => {
    void syncPremiumStoreFromCustomerInfo(customerInfo);
  };

  purchases.addCustomerInfoUpdateListener(customerInfoListener);
}

function uninstallCustomerInfoListener(purchases: PurchasesModule | null): void {
  if (!customerInfoListener) {
    return;
  }

  if (purchases) {
    purchases.removeCustomerInfoUpdateListener(customerInfoListener);
  }

  customerInfoListener = null;
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

export async function configureRevenueCat(appUserId: string): Promise<void> {
  if (isDemoModeEnabled()) {
    await activateDemoPremium();
    return;
  }

  const apiKey = selectApiKey();
  if (!apiKey) {
    logger.warn("RevenueCat key missing for current platform");
    return;
  }

  const modules = await getRevenueCatModules();
  if (!modules) {
    return;
  }

  const { purchases } = modules;

  await Promise.resolve(purchases.setLogLevel(__DEV__ ? purchases.LOG_LEVEL.DEBUG : purchases.LOG_LEVEL.INFO));

  const configured = await purchases.isConfigured();
  if (!configured) {
    purchases.configure({ apiKey, appUserID: appUserId });
  } else {
    await purchases.logIn(appUserId);
  }

  installCustomerInfoListener(purchases);

  try {
    const customerInfo = await purchases.getCustomerInfo();
    await syncPremiumStoreFromCustomerInfo(customerInfo);
  } catch (error) {
    logger.warn("RevenueCat customer info fetch failed after configure", { error: String(error) });
  }
}

export async function resetRevenueCatUser(): Promise<void> {
  if (isDemoModeEnabled()) {
    return;
  }

  const modules = await getRevenueCatModules();
  if (!modules) {
    uninstallCustomerInfoListener(null);
    return;
  }

  const { purchases } = modules;

  const configured = await purchases.isConfigured();
  if (!configured) {
    uninstallCustomerInfoListener(purchases);
    return;
  }

  uninstallCustomerInfoListener(purchases);
  try {
    await purchases.logOut();
  } catch (error) {
    logger.warn("RevenueCat logOut failed", { error: String(error) });
  }
}

export async function refreshPremiumFromRevenueCat(): Promise<{ isPremium: boolean; state: PremiumState }> {
  if (isDemoModeEnabled()) {
    await activateDemoPremium();
    return {
      isPremium: true,
      state: "active"
    };
  }

  const modules = await getRevenueCatModules();
  if (!modules) {
    return {
      isPremium: false,
      state: "error"
    };
  }

  try {
    const customerInfo = await modules.purchases.getCustomerInfo();
    const isPremium = await syncPremiumStoreFromCustomerInfo(customerInfo);

    return {
      isPremium,
      state: isPremium ? "active" : "expired"
    };
  } catch (error) {
    logger.error("RevenueCat refresh failed", { error: String(error) });
    return {
      isPremium: false,
      state: "error"
    };
  }
}

export async function purchasePremiumPackage(packageToBuy: PurchasesPackage): Promise<{ success: boolean; cancelled: boolean }> {
  if (isDemoModeEnabled()) {
    await activateDemoPremium();
    trackEvent("purchase_result", { result: "success_demo", atIso: new Date().toISOString() });
    return { success: true, cancelled: false };
  }

  const modules = await getRevenueCatModules();
  if (!modules) {
    trackEvent("purchase_result", { result: "fail_unavailable", atIso: new Date().toISOString() });
    return { success: false, cancelled: false };
  }

  trackEvent("purchase_attempted", { packageIdentifier: packageToBuy.identifier });

  try {
    const { customerInfo } = await modules.purchases.purchasePackage(packageToBuy);
    const isPremium = await syncPremiumStoreFromCustomerInfo(customerInfo);

    trackEvent("purchase_result", { result: isPremium ? "success" : "no_entitlement", atIso: new Date().toISOString() });
    return { success: isPremium, cancelled: false };
  } catch (error) {
    const cancelled = isPurchaseCancelled(error, modules.purchases);
    trackEvent("purchase_result", {
      result: cancelled ? "cancel" : "fail",
      atIso: new Date().toISOString()
    });

    if (!cancelled) {
      logger.error("RevenueCat purchase failed", { error: String(error), packageIdentifier: packageToBuy.identifier });
    }

    return { success: false, cancelled };
  }
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

  const modules = await getRevenueCatModules();
  if (!modules) {
    trackEvent("restore_purchases_result", {
      result: "fail_unavailable",
      atIso: new Date().toISOString()
    });
    return false;
  }

  try {
    const customerInfo = await modules.purchases.restorePurchases();
    const isPremium = await syncPremiumStoreFromCustomerInfo(customerInfo);

    trackEvent("restore_purchases_result", {
      result: isPremium ? "success" : "no_active_entitlement",
      atIso: new Date().toISOString()
    });

    return isPremium;
  } catch (error) {
    logger.error("RevenueCat restore failed", { error: String(error) });
    trackEvent("restore_purchases_result", {
      result: "fail",
      atIso: new Date().toISOString()
    });
    return false;
  }
}

export async function listRevenueCatPackages(): Promise<PurchasesPackage[]> {
  if (isDemoModeEnabled()) {
    return [];
  }

  const modules = await getRevenueCatModules();
  if (!modules) {
    return [];
  }

  try {
    const offerings = await modules.purchases.getOfferings();
    return offerings.current?.availablePackages ?? [];
  } catch (error) {
    logger.error("RevenueCat offerings fetch failed", { error: String(error) });
    return [];
  }
}

export async function getCycleFitPlans(): Promise<RevenueCatPlans> {
  if (isDemoModeEnabled()) {
    return {
      monthly: null,
      yearly: null,
      lifetime: null
    };
  }

  const modules = await getRevenueCatModules();
  if (!modules) {
    return {
      monthly: null,
      yearly: null,
      lifetime: null
    };
  }

  const packages = await listRevenueCatPackages();

  const monthlyById = packages.find((pkg) => matchesCustomPackageIdentifier(pkg, CYCLEFIT_MONTHLY_PACKAGE_ID)) ?? null;
  const yearlyById = packages.find((pkg) => matchesCustomPackageIdentifier(pkg, CYCLEFIT_YEARLY_PACKAGE_ID)) ?? null;
  const lifetimeById = packages.find((pkg) => matchesCustomPackageIdentifier(pkg, CYCLEFIT_LIFETIME_PACKAGE_ID)) ?? null;

  const monthlyByType = packages.find((pkg) => pkg.packageType === modules.purchases.PACKAGE_TYPE.MONTHLY) ?? null;
  const yearlyByType = packages.find((pkg) => pkg.packageType === modules.purchases.PACKAGE_TYPE.ANNUAL) ?? null;
  const lifetimeByType = packages.find((pkg) => pkg.packageType === modules.purchases.PACKAGE_TYPE.LIFETIME) ?? null;

  return {
    monthly: monthlyById ?? monthlyByType,
    yearly: yearlyById ?? yearlyByType,
    lifetime: lifetimeById ?? lifetimeByType
  };
}

export async function presentCycleFitProPaywallIfNeeded(): Promise<{ success: boolean; result: PaywallResult }> {
  if (isDemoModeEnabled()) {
    await activateDemoPremium();
    return {
      success: true,
      result: fallbackPaywallResult.NOT_PRESENTED
    };
  }

  const modules = await getRevenueCatModules();
  if (!modules) {
    return {
      success: false,
      result: fallbackPaywallResult.ERROR
    };
  }

  trackEvent("paywall_viewed", { source: "revenuecat_ui_if_needed", atIso: new Date().toISOString() });

  try {
    const result = await modules.revenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: CYCLEFIT_PRO_ENTITLEMENT_ID
    });

    const customerInfo = await modules.purchases.getCustomerInfo();
    const isPremium = await syncPremiumStoreFromCustomerInfo(customerInfo);

    return {
      success: isPremium,
      result
    };
  } catch (error) {
    logger.error("RevenueCat paywallIfNeeded failed", { error: String(error) });
    return {
      success: false,
      result: modules.paywallResult.ERROR
    };
  }
}

export async function presentCycleFitProPaywall(): Promise<{ success: boolean; result: PaywallResult }> {
  if (isDemoModeEnabled()) {
    await activateDemoPremium();
    return {
      success: true,
      result: fallbackPaywallResult.NOT_PRESENTED
    };
  }

  const modules = await getRevenueCatModules();
  if (!modules) {
    return {
      success: false,
      result: fallbackPaywallResult.ERROR
    };
  }

  trackEvent("paywall_viewed", { source: "revenuecat_ui", atIso: new Date().toISOString() });

  try {
    const result = await modules.revenueCatUI.presentPaywall();
    const customerInfo = await modules.purchases.getCustomerInfo();
    const isPremium = await syncPremiumStoreFromCustomerInfo(customerInfo);

    return {
      success: isPremium,
      result
    };
  } catch (error) {
    logger.error("RevenueCat paywall presentation failed", { error: String(error) });
    return {
      success: false,
      result: modules.paywallResult.ERROR
    };
  }
}

export async function openCustomerCenter(): Promise<boolean> {
  if (isDemoModeEnabled()) {
    return true;
  }

  const modules = await getRevenueCatModules();
  if (!modules) {
    return false;
  }

  try {
    await modules.revenueCatUI.presentCustomerCenter();
    return true;
  } catch (error) {
    logger.error("RevenueCat Customer Center failed", { error: String(error) });
    return false;
  }
}
