import { create } from "zustand";

import type { EquipmentAccess, FitnessLevel, RidingEnvironment, WeeklyTrainingDays, WorkoutTimePreference } from "@/api/types";
import { toIsoDate } from "@/utils/date";

type OnboardingState = {
  displayName: string;
  fitnessLevel: FitnessLevel;
  goal: string;
  weeklyTrainingDays: WeeklyTrainingDays;
  ridingEnvironment: RidingEnvironment;
  availableWorkoutTime: WorkoutTimePreference;
  equipmentAccess: EquipmentAccess[];
  lastPeriodDate: string;
  cycleLengthDays: number;
  periodLengthDays: number;
  setDraft: (
    patch: Partial<{
      displayName: string;
      fitnessLevel: FitnessLevel;
      goal: string;
      weeklyTrainingDays: WeeklyTrainingDays;
      ridingEnvironment: RidingEnvironment;
      availableWorkoutTime: WorkoutTimePreference;
      equipmentAccess: EquipmentAccess[];
      lastPeriodDate: string;
      cycleLengthDays: number;
      periodLengthDays: number;
    }>
  ) => void;
  reset: () => void;
};

const initialState = {
  displayName: "",
  fitnessLevel: "beginner" as const,
  goal: "Build endurance",
  weeklyTrainingDays: "3-4" as const,
  ridingEnvironment: "mixed" as const,
  availableWorkoutTime: "medium" as const,
  equipmentAccess: ["home_equipment"] as EquipmentAccess[],
  lastPeriodDate: toIsoDate(new Date()),
  cycleLengthDays: 28,
  periodLengthDays: 5
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,
  setDraft: (patch) => set((state) => ({ ...state, ...patch })),
  reset: () => set(initialState)
}));
