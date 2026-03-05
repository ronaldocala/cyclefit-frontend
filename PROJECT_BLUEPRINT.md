# CycleFit+ Frontend Blueprint

## Assumptions and UI Folder Needs
- `UI/` contains one PNG + one HTML per screen, matched by filename.
- HTML is authoritative for layout regions, spacing intent, component hierarchy, and labels.
- PNG is authoritative for visual density, card scale, and emphasis.
- New screens can be added later, existing components/tokens should absorb new assets with minimal refactor.
- For missing assets, implementation follows the same calm visual system and low cognitive load pattern.

## 1) Project Blueprint

### Stack
- React Native + TypeScript, Expo managed workflow.
- Navigation: React Navigation (`native-stack` + bottom tabs).
- Server state: TanStack Query.
- App state: Zustand.
- Forms: React Hook Form + Zod.
- Styling: centralized StyleSheet tokens (chosen over NativeWind for stronger type-safe token control and easier long-term maintenance in a design-token system).
- Storage: AsyncStorage for non-sensitive state, SecureStore for auth session tokens.
- Telemetry: Sentry (chosen over Crashlytics because Expo workflow integrates quickly and consistently across iOS/Android with fewer native steps).

### Folder Structure
- `src/screens/`
- `src/components/`
- `src/features/`
- `src/services/`
- `src/store/`
- `src/navigation/`
- `src/theme/`
- `src/utils/`

### Navigation Map
- Root stack
  - `Auth`
    - `Welcome`
    - `SignIn`
  - `Onboarding`
    - `CycleSetup`
    - `TrainingGoals`
  - `Main` tabs
    - `Today`
    - `Workouts`
    - `Progress`
    - `Settings`
  - modal routes
    - `PremiumUpsell`
    - `WorkoutSession`

### Data Flow
`Auth session` -> `profiles` + `cycle_settings` -> local `cycle phase compute` -> `today recommendation` -> gated actions by `isPremium`.

### Premium Gating Strategy
- Single app-level source: Zustand `isPremium` boolean.
- Reconcile on app start and auth changes:
  1. read cached premium state (TTL 15 min),
  2. call backend `entitlement_check`,
  3. overwrite local derived state.
- UI uses `isPremium` to switch Today and Workouts capabilities.
- Backend remains authoritative with RLS and function checks.

## 2) UI Asset to RN Mapping

| ScreenName | Route Name | Source PNG | Source HTML | Components Used |
|---|---|---|---|---|
| Welcome | `Auth/Welcome` | `UI/welcome.png` | `UI/welcome.html` | `ScreenContainer`, `AppText`, `AppButton`, hero image block, member avatars |
| Cycle Setup | `Onboarding/CycleSetup` | `UI/cycle-setup.png` | `UI/cycle-setup.html` | `AppCard`, inputs, option chips, info callout, primary/ghost CTA |
| Training Goals | `Onboarding/TrainingGoals` | `UI/preferences.png` | `UI/preferences.html` | segmented chips, hero card image, continue CTA |
| Today (Free) | `Main/Today` when `isPremium=false` | `UI/non-premium-home.png` | `UI/non-premium-home.html` | `PhaseRing`, recommendation card, dual free CTAs, subtle upgrade card |
| Today (Premium) | `Main/Today` when `isPremium=true` | `UI/premium-home.png` | `UI/premium-home.html` | `PhaseRing`, premium badge, start workout CTA, nutrition/sleep insights |
| Premium Upsell | `Root/PremiumUpsell` | `UI/upgrade-to-premium.png` | `UI/upgrade-to-premium.html` | hero image, benefits list, pricing card, trial CTA, skip action |

### Screens Improvised (missing UI assets)
- `Main/Workouts`, `Root/WorkoutSession`, `Main/Progress`, `Main/Settings`.
- Built with the same token system, card rhythm, and low-cognitive-load patterns.

## 3) Implementation Plan and Milestones

1. Foundation
- Expo + TS setup, strict typing, env contract, tokenized theme, Query client.

2. Core Platform Services
- Supabase client/auth wrapper, typed data services, SecureStore + AsyncStorage wrappers, logger/Sentry.

3. Navigation and Bootstrap
- Root/auth/onboarding/main navigators, session bootstrap, offline queue sync on startup.

4. UI Asset Translation
- Implement all six referenced UI screens with shared components and tokenized styles.

5. Business Logic
- Cycle phase calculator + manual override, premium reconciliation and UI gating, recommendation model.

6. Workout Reliability
- Offline-first session save queue with network sync retry.

7. Product Completion
- Progress metrics, settings updates, restore purchases, account deletion wiring.

## 4) Code Scaffolding and Key Files

### App and Config
- `App.tsx`
- `app.config.ts`
- `package.json`
- `tsconfig.json`
- `babel.config.js`
- `.env.example`

### Navigation
- `src/navigation/AppNavigator.tsx`
- `src/navigation/AuthNavigator.tsx`
- `src/navigation/OnboardingNavigator.tsx`
- `src/navigation/MainTabNavigator.tsx`
- `src/navigation/types.ts`

### Theme and Components
- `src/theme/tokens.ts`
- `src/components/AppText.tsx`
- `src/components/AppButton.tsx`
- `src/components/AppCard.tsx`
- `src/components/ScreenContainer.tsx`
- `src/components/PhaseRing.tsx`

### Auth and Onboarding
- `src/screens/auth/WelcomeScreen.tsx`
- `src/screens/auth/SignInScreen.tsx`
- `src/features/auth/hooks/useAuthScreen.ts`
- `src/screens/onboarding/CycleSetupScreen.tsx`
- `src/screens/onboarding/TrainingGoalsScreen.tsx`
- `src/features/onboarding/hooks/useCycleSetupScreen.ts`

### Supabase + RevenueCat Wrappers
- `src/services/supabase/client.ts`
- `src/services/supabase/authService.ts`
- `src/services/supabase/profileService.ts`
- `src/services/supabase/cycleService.ts`
- `src/services/supabase/workoutsService.ts`
- `src/services/supabase/sessionsService.ts`
- `src/services/supabase/exercisesService.ts`
- `src/services/supabase/premiumService.ts`
- `src/services/revenuecat/revenueCatService.ts`

### Today Screen and Premium/Free UX
- `src/screens/today/TodayScreen.tsx`
- `src/screens/today/PremiumUpsellScreen.tsx`
- `src/features/today/hooks/useTodayScreen.ts`
- `src/features/subscriptions/hooks/usePremiumStatus.ts`

### Workouts, Session, Progress, Settings
- `src/screens/workouts/WorkoutsScreen.tsx`
- `src/screens/workout-session/WorkoutSessionScreen.tsx`
- `src/features/workout-session/hooks/useWorkoutSession.ts`
- `src/services/sync/offlineQueue.ts`
- `src/screens/progress/ProgressScreen.tsx`
- `src/features/progress/hooks/useProgressScreen.ts`
- `src/screens/settings/SettingsScreen.tsx`
- `src/features/settings/hooks/useSettingsScreen.ts`

### Stores and Utils
- `src/store/authStore.ts`
- `src/store/appStore.ts`
- `src/features/cycle/cycleCalculator.ts`
- `src/features/cycle/hooks/useCyclePhase.ts`
- `src/hooks/useAppBootstrap.ts`
- `src/utils/env.ts`
- `src/utils/constants.ts`
- `src/utils/date.ts`
- `src/utils/errors.ts`
