import { create } from "zustand";

import type { RootStackParamList } from "@/navigation/types";
import type { PremiumState } from "@/services/revenuecat/revenueCatService";
import type { CyclePhase } from "@/utils/constants";

type WorkoutSourceType = RootStackParamList["WorkoutSession"]["sourceType"];

type WorkoutSetLogEntry = {
  weightKg: string;
  reps: string;
  seconds: string;
};

export type WorkoutSessionDraft = {
  intensity: "Low" | "Moderate" | "High";
  durationInput: string;
  weightKg: string;
  reps: string;
  expandedSetIds: Record<string, boolean>;
  setLogsByExercise: Record<string, WorkoutSetLogEntry[]>;
};

export type ActiveWorkout = {
  sourceType: WorkoutSourceType;
  sourceId?: string;
  startedAtIso: string;
  draft: WorkoutSessionDraft;
};

const defaultWorkoutDraft: WorkoutSessionDraft = {
  intensity: "Moderate",
  durationInput: "45",
  weightKg: "",
  reps: "",
  expandedSetIds: {},
  setLogsByExercise: {}
};

type AppStoreState = {
  phaseOverride: CyclePhase | null;
  isPremium: boolean;
  premiumState: PremiumState;
  activeWorkout: ActiveWorkout | null;
  setPhaseOverride: (phase: CyclePhase | null) => void;
  setPremium: (isPremium: boolean, premiumState: PremiumState) => void;
  startWorkoutSession: (input: { sourceType: WorkoutSourceType; sourceId?: string; startedAtIso: string }) => void;
  updateWorkoutDraft: (patch: Partial<WorkoutSessionDraft>) => void;
  clearWorkoutSession: () => void;
};

export const useAppStore = create<AppStoreState>((set) => ({
  phaseOverride: null,
  isPremium: false,
  premiumState: "unknown",
  activeWorkout: null,
  setPhaseOverride: (phaseOverride) => set({ phaseOverride }),
  setPremium: (isPremium, premiumState) => set({ isPremium, premiumState }),
  startWorkoutSession: ({ sourceType, sourceId, startedAtIso }) =>
    set((state) => {
      const previousDraft =
        state.activeWorkout &&
        state.activeWorkout.sourceType === sourceType &&
        state.activeWorkout.sourceId === sourceId
          ? state.activeWorkout.draft
          : defaultWorkoutDraft;

      return {
        activeWorkout: {
          sourceType,
          sourceId,
          startedAtIso,
          draft: previousDraft
        }
      };
    }),
  updateWorkoutDraft: (patch) =>
    set((state) => {
      if (!state.activeWorkout) {
        return state;
      }

      return {
        activeWorkout: {
          ...state.activeWorkout,
          draft: {
            ...state.activeWorkout.draft,
            ...patch
          }
        }
      };
    }),
  clearWorkoutSession: () => set({ activeWorkout: null })
}));
