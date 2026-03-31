import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { CycleSettingsState, OnboardingPreferences, Profile } from "@/api/types";
import { demoCycleSettings, demoOnboardingPreferences, demoProfile } from "@/services/demo/demoData";
import { nowIso } from "@/utils/date";

type DemoStoreState = {
  profile: Profile;
  cycleState: CycleSettingsState;
  onboardingPreferences: OnboardingPreferences;
  setProfile: (patch: Partial<Profile>) => Profile;
  setCycleState: (input: {
    last_period_date: string;
    cycle_length_days: number;
    period_length_days: number;
    historical_last_period_date?: string | null;
    historical_cycle_length_days?: number | null;
    historical_period_length_days?: number | null;
    future_phase_start_date?: string | null;
  }) => CycleSettingsState;
  setOnboardingPreferences: (
    patch: Partial<Pick<OnboardingPreferences, "equipment_access" | "weekly_training_days" | "riding_environment" | "available_workout_time">>
  ) => OnboardingPreferences;
};

function createInitialCycleState(): CycleSettingsState {
  return {
    settings: demoCycleSettings,
    syncStatus: "synced",
    lastSyncedAt: nowIso()
  };
}

export const useDemoStore = create<DemoStoreState>()(
  persist(
    (set, get) => ({
      profile: demoProfile,
      cycleState: createInitialCycleState(),
      onboardingPreferences: demoOnboardingPreferences,
      setProfile: (patch) => {
        const nextProfile: Profile = {
          ...get().profile,
          ...patch,
          updated_at: nowIso()
        };
        set({ profile: nextProfile });
        return nextProfile;
      },
      setCycleState: (input) => {
        const current = get().cycleState;
        const nextCycleState: CycleSettingsState = {
          settings: {
            ...(current.settings ?? demoCycleSettings),
            ...input,
            updated_at: nowIso()
          },
          syncStatus: "synced",
          lastSyncedAt: nowIso()
        };
        set({ cycleState: nextCycleState });
        return nextCycleState;
      },
      setOnboardingPreferences: (patch) => {
        const nextPreferences: OnboardingPreferences = {
          ...get().onboardingPreferences,
          ...patch,
          updated_at: nowIso()
        };
        set({ onboardingPreferences: nextPreferences });
        return nextPreferences;
      }
    }),
    {
      name: "cyclefit.demo-state",
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);
