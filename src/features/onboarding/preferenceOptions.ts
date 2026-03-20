import type { EquipmentAccess, FitnessLevel, WeeklyTrainingDays, WorkoutTimePreference } from "@/api/types";

export const experienceOptions: { label: string; value: FitnessLevel; description: string }[] = [
  { label: "Beginner", value: "beginner", description: "New to structured training or returning after time away." },
  { label: "Intermediate", value: "intermediate", description: "You train regularly and want more structure." },
  { label: "Advanced", value: "advanced", description: "You already have a routine and want smarter cycle timing." }
];

export const goalOptions = ["Build endurance", "Stay consistent", "Improve strength", "Reduce cycle-related friction"] as const;

export const availabilityOptions: WeeklyTrainingDays[] = ["1-2", "3-4", "5+"];

export const workoutTimeOptions: { label: string; value: WorkoutTimePreference; description: string }[] = [
  { label: "Short", value: "short", description: "Usually under 20 minutes." },
  { label: "Medium", value: "medium", description: "Usually 20 to 40 minutes." },
  { label: "Long", value: "long", description: "Usually 40+ minutes." }
];

export const equipmentOptions: { label: string; value: EquipmentAccess }[] = [
  { label: "Home equipment", value: "home_equipment" },
  { label: "Gym equipment", value: "gym_equipment" }
];
