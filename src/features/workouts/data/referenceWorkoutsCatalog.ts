import type { FitnessLevel } from "@/api/types";
import type { CyclePhase } from "@/utils/constants";

import { generatedReferenceWorkouts } from "@/features/workouts/data/referenceWorkouts.generated";

export type WorkoutEnvironment = "home" | "gym";
export type WorkoutLength = "short" | "medium" | "long";
export type WorkoutIntensity = "low" | "moderate" | "high";
export type WorkoutSectionId = "warmup" | "main" | "cooldown";

export type ReferenceWorkoutEntry = {
  title: string;
  detail?: string | null;
};

export type ReferenceWorkoutSection = {
  id: WorkoutSectionId;
  label: string;
  entries: ReferenceWorkoutEntry[];
};

export type ReferenceWorkout = {
  id: string;
  slug: string;
  name: string;
  phase: CyclePhase;
  environment: WorkoutEnvironment;
  category: string;
  level: FitnessLevel;
  length: WorkoutLength;
  lengthLabel: string;
  intensity: WorkoutIntensity;
  durationLabel: string;
  estDurationMinutes: number;
  equipmentLabel: string;
  description: string;
  sections: ReferenceWorkoutSection[];
};

export const referenceWorkouts = generatedReferenceWorkouts;

const previewImageByCategoryAndEnvironment: Record<string, string> = {
  "strength:home": "https://liftmanual.com/wp-content/uploads/2023/04/dumbbell-goblet-squat.jpg",
  "strength:gym": "https://liftmanual.com/wp-content/uploads/2023/04/dumbbell-bench-press.jpg",
  "cardio:home": "https://liftmanual.com/wp-content/uploads/2023/04/side-lunge.jpg",
  "cardio:gym": "https://liftmanual.com/wp-content/uploads/2023/04/dumbbell-bent-over-row.jpg",
  "yoga:home": "https://liftmanual.com/wp-content/uploads/2023/04/child-pose.jpg",
  "yoga:gym": "https://liftmanual.com/wp-content/uploads/2023/04/child-pose.jpg",
  "stretch:home": "https://liftmanual.com/wp-content/uploads/2023/04/hamstring-stretch.jpg",
  "stretch:gym": "https://liftmanual.com/wp-content/uploads/2023/04/hamstring-stretch.jpg",
  "mobility:home": "https://liftmanual.com/wp-content/uploads/2023/04/arm-circles.jpg",
  "mobility:gym": "https://liftmanual.com/wp-content/uploads/2023/04/arm-circles.jpg"
};

export function getReferenceWorkoutPreviewImage(workout: Pick<ReferenceWorkout, "category" | "environment">): string {
  const key = `${workout.category}:${workout.environment}`;

  return previewImageByCategoryAndEnvironment[key] ?? previewImageByCategoryAndEnvironment["strength:home"];
}

export function getReferenceWorkoutById(workoutId: string | null | undefined): ReferenceWorkout | null {
  if (!workoutId) {
    return null;
  }

  return referenceWorkouts.find((workout) => workout.id === workoutId) ?? null;
}
