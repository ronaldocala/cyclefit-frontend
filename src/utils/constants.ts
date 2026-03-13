export const storageKeys = {
  premiumCache: "cyclefit.premiumCache",
  offlineQueue: "cyclefit.offlineQueue",
  cycleSettingsCachePrefix: "cyclefit.cycleSettings",
  dailyProgressLogsCachePrefix: "cyclefit.dailyProgressLogs"
} as const;

export const premiumCacheTtlMs = 15 * 60 * 1000;

export const phases = ["menstrual", "follicular", "ovulation", "luteal"] as const;
export type CyclePhase = (typeof phases)[number];
