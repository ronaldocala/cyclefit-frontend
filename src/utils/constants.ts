export const storageKeys = {
  phaseOverride: "cyclefit.phaseOverride",
  premiumCache: "cyclefit.premiumCache",
  offlineQueue: "cyclefit.offlineQueue"
} as const;

export const premiumCacheTtlMs = 15 * 60 * 1000;

export const phases = ["menstrual", "follicular", "ovulation", "luteal"] as const;
export type CyclePhase = (typeof phases)[number];
