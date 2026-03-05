import { create } from "zustand";

import type { PremiumState } from "@/services/revenuecat/revenueCatService";
import type { CyclePhase } from "@/utils/constants";

type AppStoreState = {
  phaseOverride: CyclePhase | null;
  isPremium: boolean;
  premiumState: PremiumState;
  setPhaseOverride: (phase: CyclePhase | null) => void;
  setPremium: (isPremium: boolean, premiumState: PremiumState) => void;
};

export const useAppStore = create<AppStoreState>((set) => ({
  phaseOverride: null,
  isPremium: false,
  premiumState: "unknown",
  setPhaseOverride: (phaseOverride) => set({ phaseOverride }),
  setPremium: (isPremium, premiumState) => set({ isPremium, premiumState })
}));
