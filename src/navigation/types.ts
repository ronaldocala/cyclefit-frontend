export type AuthStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
};

export type OnboardingStackParamList = {
  Intro: undefined;
  TrainingGoals: undefined;
  CycleSetup: undefined;
};

export type MainTabParamList = {
  Today: undefined;
  Workouts: undefined;
  Progress: undefined;
  Settings: undefined;
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  ProfileSettings: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
  PremiumUpsell: undefined;
  WorkoutSession: { sourceType: "user_workout" | "premium_workout" | "quick_log"; sourceId?: string; autoStart?: boolean };
};
