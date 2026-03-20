import type { CycleSettings, OnboardingPreferences, PremiumWorkout, Profile, UserWorkout, WorkoutSession } from "@/api/types";

const nowIso = new Date().toISOString();
const todayIso = nowIso.slice(0, 10);

export const demoProfile: Profile = {
  user_id: "demo-user",
  display_name: "Demo Rider",
  units: "metric",
  goal: "Build endurance",
  fitness_level: "intermediate",
  timezone: "Europe/Warsaw",
  last_seen_phase: "follicular",
  created_at: nowIso,
  updated_at: nowIso
};

export const demoCycleSettings: CycleSettings = {
  user_id: "demo-user",
  last_period_date: todayIso,
  cycle_length_days: 28,
  period_length_days: 5,
  created_at: nowIso,
  updated_at: nowIso
};

export const demoOnboardingPreferences: OnboardingPreferences = {
  user_id: "demo-user",
  equipment_access: ["gym_equipment"],
  weekly_training_days: "3-4",
  riding_environment: "mixed",
  available_workout_time: "medium",
  onboarding_completed_at: nowIso,
  created_at: nowIso,
  updated_at: nowIso
};

export const demoUserWorkouts: UserWorkout[] = [
  {
    id: "demo-workout-1",
    user_id: "demo-user",
    name: "Tempo Ride Builder",
    description: "Steady tempo intervals with short recoveries.",
    is_template: false,
    created_at: nowIso,
    updated_at: nowIso
  },
  {
    id: "demo-workout-2",
    user_id: "demo-user",
    name: "Core + Mobility",
    description: "Off-bike strength and mobility circuit.",
    is_template: false,
    created_at: nowIso,
    updated_at: nowIso
  },
  {
    id: "demo-workout-ui-test",
    user_id: "demo-user",
    name: "Mock Workout UI Test",
    description: "Testing workout for the new session UI flow.",
    is_template: false,
    created_at: nowIso,
    updated_at: nowIso
  }
];

export const demoPremiumWorkouts: PremiumWorkout[] = [
  {
    id: "demo-premium-menstrual-1",
    slug: "cycle-reset-flow",
    name: "Cycle Reset Flow",
    description: "Low-impact mobility and breath-led strength for menstrual days.",
    level: "beginner",
    est_duration_minutes: 25,
    is_published: true
  },
  {
    id: "demo-premium-follicular-1",
    slug: "progressive-strength-ladder",
    name: "Progressive Strength Ladder",
    description: "Compound lifting focus with progressive loading blocks.",
    level: "intermediate",
    est_duration_minutes: 40,
    is_published: true
  },
  {
    id: "demo-premium-ovulation-1",
    slug: "peak-power-intervals",
    name: "Peak Power Intervals",
    description: "Explosive intervals and short recoveries for output days.",
    level: "advanced",
    est_duration_minutes: 35,
    is_published: true
  },
  {
    id: "demo-premium-luteal-1",
    slug: "steady-engine-builder",
    name: "Steady Engine Builder",
    description: "Moderate intensity endurance with controlled pacing.",
    level: "intermediate",
    est_duration_minutes: 30,
    is_published: true
  },
  {
    id: "demo-premium-1",
    slug: "vo2-max-builder",
    name: "VO2 Max Builder",
    description: "High-intensity intervals for power gains.",
    level: "advanced",
    est_duration_minutes: 42,
    is_published: true
  },
  {
    id: "demo-premium-2",
    slug: "threshold-climb",
    name: "Threshold Climb Session",
    description: "Sustained climbing effort with pace control.",
    level: "intermediate",
    est_duration_minutes: 36,
    is_published: true
  },
  {
    id: "demo-premium-ui-test",
    slug: "strength-toning-ui-test",
    name: "Strength & Toning",
    description: "Testing premium workout UI with warm-up, sets, and cooldown.",
    level: "intermediate",
    est_duration_minutes: 35,
    is_published: true
  }
];

export const demoWorkoutSessions: WorkoutSession[] = [
  {
    id: "demo-session-1",
    user_id: "demo-user",
    user_workout_id: "demo-workout-1",
    source_type: "user_workout",
    source_id: "demo-workout-1",
    status: "completed",
    started_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 24 * 60 * 60 * 1000 + 34 * 60 * 1000).toISOString(),
    duration_seconds: 34 * 60,
    rpe: 7,
    notes: "Felt strong in the final interval.",
    created_at: nowIso,
    updated_at: nowIso
  },
  {
    id: "demo-session-2",
    user_id: "demo-user",
    user_workout_id: null,
    source_type: "quick_log",
    source_id: null,
    status: "completed",
    started_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 28 * 60 * 1000).toISOString(),
    duration_seconds: 28 * 60,
    rpe: 6,
    notes: null,
    created_at: nowIso,
    updated_at: nowIso
  },
  {
    id: "demo-session-3",
    user_id: "demo-user",
    user_workout_id: null,
    source_type: "premium_workout",
    source_id: "demo-premium-1",
    status: "completed",
    started_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 40 * 60 * 1000).toISOString(),
    duration_seconds: 40 * 60,
    rpe: 8,
    notes: "Hard but manageable.",
    created_at: nowIso,
    updated_at: nowIso
  }
];
