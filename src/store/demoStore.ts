import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { CycleSettingsState, Profile } from "@/api/types";
import { demoCycleSettings, demoProfile } from "@/services/demo/demoData";
import { nowIso } from "@/utils/date";

type DemoStoreState = {
  profile: Profile;
  cycleState: CycleSettingsState;
  setProfile: (patch: Partial<Profile>) => Profile;
  setCycleState: (input: { last_period_date: string; cycle_length_days: number; period_length_days: number }) => CycleSettingsState;
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
      }
    }),
    {
      name: "cyclefit.demo-state",
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);
