import { asyncStorageService } from "@/services/storage/asyncStorage";
import { premiumCacheTtlMs, storageKeys } from "@/utils/constants";

export type PremiumState = "loading" | "active" | "expired" | "unknown" | "error";

type PremiumCache = {
  isPremium: boolean;
  updatedAtIso: string;
};

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
