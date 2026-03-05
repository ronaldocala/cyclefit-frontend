import { Platform } from "react-native";
import Purchases, { CustomerInfo, PurchasesPackage } from "react-native-purchases";

import { asyncStorageService } from "@/services/storage/asyncStorage";
import { trackEvent } from "@/services/telemetry/analytics";
import { logger } from "@/services/telemetry/logger";
import { premiumCacheTtlMs, storageKeys } from "@/utils/constants";
import { env } from "@/utils/env";

export type PremiumState = "loading" | "active" | "expired" | "unknown" | "error";

type PremiumCache = {
  isPremium: boolean;
  updatedAtIso: string;
};

function selectApiKey(): string {
  if (Platform.OS === "ios") {
    return env.revenueCatAppleApiKey;
  }
  return env.revenueCatGoogleApiKey;
}

function isPremiumFromCustomerInfo(customerInfo: CustomerInfo): boolean {
  return Boolean(customerInfo.entitlements.active.premium);
}

async function savePremiumCache(isPremium: boolean): Promise<void> {
  await asyncStorageService.set<PremiumCache>(storageKeys.premiumCache, {
    isPremium,
    updatedAtIso: new Date().toISOString()
  });
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
  const apiKey = selectApiKey();
  if (!apiKey) {
    logger.warn("RevenueCat key missing for current platform");
    return;
  }

  await Purchases.configure({ apiKey, appUserID: appUserId });
}

export async function refreshPremiumFromRevenueCat(): Promise<{ isPremium: boolean; state: PremiumState }> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const isPremium = isPremiumFromCustomerInfo(customerInfo);
    await savePremiumCache(isPremium);

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
  trackEvent("purchase_attempted", { packageIdentifier: packageToBuy.identifier });

  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToBuy);
    const isPremium = isPremiumFromCustomerInfo(customerInfo);
    await savePremiumCache(isPremium);

    trackEvent("purchase_result", { result: "success", atIso: new Date().toISOString() });

    return { success: isPremium, cancelled: false };
  } catch (error) {
    const cancelled = String(error).toLowerCase().includes("cancel");
    trackEvent("purchase_result", {
      result: cancelled ? "cancel" : "fail",
      atIso: new Date().toISOString()
    });

    return { success: false, cancelled };
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPremium = isPremiumFromCustomerInfo(customerInfo);
    await savePremiumCache(isPremium);

    trackEvent("restore_purchases_result", {
      result: isPremium ? "success" : "no_active_entitlement",
      atIso: new Date().toISOString()
    });

    return isPremium;
  } catch {
    trackEvent("restore_purchases_result", {
      result: "fail",
      atIso: new Date().toISOString()
    });
    return false;
  }
}

export async function listRevenueCatPackages() {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages ?? [];
  } catch {
    return [];
  }
}
