export type FitnessLevel = "beginner" | "intermediate" | "advanced";
export type Units = "metric" | "imperial";

export type Profile = {
  user_id: string;
  display_name: string | null;
  units: Units;
  goal: string | null;
  fitness_level: FitnessLevel;
  timezone: string;
  last_seen_phase: string | null;
  created_at: string;
  updated_at: string;
};

export type CycleSettings = {
  user_id: string;
  last_period_date: string;
  cycle_length_days: number;
  period_length_days: number;
  created_at: string;
  updated_at: string;
};

export type CycleSettingsSyncStatus = "synced" | "pending";

export type CycleSettingsState = {
  settings: CycleSettings | null;
  syncStatus: CycleSettingsSyncStatus;
  lastSyncedAt: string | null;
};

export type DailyProgressLog = {
  user_id: string;
  log_date: string;
  mood_level: number | null;
  energy_level: number | null;
  created_at: string;
  updated_at: string;
};

export type DailyProgressLogSyncStatus = "synced" | "pending";

export type DailyProgressLogState = {
  entry: DailyProgressLog | null;
  syncStatus: DailyProgressLogSyncStatus;
  lastSyncedAt: string | null;
};

export type Exercise = {
  id: number;
  slug: string;
  name: string;
  category: string;
  equipment: string[];
  muscle_groups: string[];
  instructions: string | null;
  is_active: boolean;
};

export type UserWorkout = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_template: boolean;
  created_at: string;
  updated_at: string;
};

export type WorkoutSession = {
  id: string;
  user_id: string;
  user_workout_id: string | null;
  source_type: "user_workout" | "premium_workout" | "quick_log";
  source_id: string | null;
  status: "started" | "completed" | "abandoned";
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  rpe: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PremiumWorkout = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  level: FitnessLevel;
  est_duration_minutes: number | null;
  is_published: boolean;
};

export type PremiumPlan = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  level: FitnessLevel;
  weeks: number;
  is_published: boolean;
};

export type EntitlementStatus = {
  entitlement_id: string;
  is_active: boolean;
  expires_at: string | null;
  source: string | null;
  updated_at: string | null;
};
