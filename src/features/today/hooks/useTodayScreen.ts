import { useEffect, useMemo, useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import type { DailyProgressLogState } from "@/api/types";
import { useCyclePhase } from "@/features/cycle/hooks/useCyclePhase";
import { getCycleSettingsState } from "@/services/supabase/cycleService";
import { getDailyProgressLogState, saveDailyProgressLog } from "@/services/supabase/dailyProgressLogService";
import { getProfile } from "@/services/supabase/profileService";
import { useDemoStore } from "@/store/demoStore";
import { useDemoMode } from "@/utils/demoMode";
import { toIsoDate } from "@/utils/date";

const recommendations = {
  menstrual: {
    title: "Cycle Reset Flow",
    durationMinutes: 25,
    workoutDescription: "Keep intensity low and prioritize gentle movement, breathing, and recovery-focused mobility work.",
    alternateWorkouts: ["Gentle Mobility Circuit", "Light Core Stability"],
    premiumWorkoutId: "demo-premium-menstrual-1"
  },
  follicular: {
    title: "Progressive Strength Ladder",
    durationMinutes: 40,
    workoutDescription: "Energy is rising, so this is a strong window for progressive overload and compound strength sessions.",
    alternateWorkouts: ["Lower Body Strength Focus", "Upper Push-Pull Builder"],
    premiumWorkoutId: "demo-premium-follicular-1"
  },
  ovulation: {
    title: "Peak Power Intervals",
    durationMinutes: 35,
    workoutDescription: "Use this phase for higher output intervals, power work, and faster-paced training blocks.",
    alternateWorkouts: ["Explosive Sprint Set", "HIIT Power Builder"],
    premiumWorkoutId: "demo-premium-ovulation-1"
  },
  luteal: {
    title: "Steady Engine Builder",
    durationMinutes: 30,
    workoutDescription: "Focus on steady efforts, moderate loads, and extra recovery support to stay consistent.",
    alternateWorkouts: ["Zone 2 Endurance Ride", "Moderate Tempo Intervals"],
    premiumWorkoutId: "demo-premium-luteal-1"
  }
} as const;

function createEmptyDailyProgressState(): DailyProgressLogState {
  return {
    entry: null,
    syncStatus: "synced",
    lastSyncedAt: null
  };
}

function mergeDailyProgressState(
  currentState: DailyProgressLogState,
  input: { logDate: string; moodLevel?: number | null; energyLevel?: number | null }
): DailyProgressLogState {
  const timestamp = new Date().toISOString();
  const currentEntry = currentState.entry;

  return {
    entry: {
      user_id: currentEntry?.user_id ?? "",
      log_date: input.logDate,
      mood_level: input.moodLevel !== undefined ? input.moodLevel : (currentEntry?.mood_level ?? null),
      energy_level: input.energyLevel !== undefined ? input.energyLevel : (currentEntry?.energy_level ?? null),
      created_at: currentEntry?.created_at ?? timestamp,
      updated_at: timestamp
    },
    syncStatus: "pending",
    lastSyncedAt: currentState.lastSyncedAt
  };
}

export function useTodayScreen() {
  const isDemoMode = useDemoMode();
  const demoProfile = useDemoStore((state) => state.profile);
  const demoCycleState = useDemoStore((state) => state.cycleState);
  const todayKey = toIsoDate(new Date());
  const [dailyProgressState, setDailyProgressState] = useState<DailyProgressLogState>(createEmptyDailyProgressState);
  const [dailyProgressLoaded, setDailyProgressLoaded] = useState(false);
  const latestSaveRequestIdRef = useRef(0);

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: !isDemoMode
  });

  const cycleQuery = useQuery({
    queryKey: ["cycleSettings"],
    queryFn: getCycleSettingsState,
    enabled: !isDemoMode
  });

  const profile = isDemoMode ? demoProfile : (profileQuery.data ?? null);
  const cycleState = isDemoMode ? demoCycleState : cycleQuery.data;
  const cycleSettings = cycleState?.settings ?? null;
  const cycleSummary = useCyclePhase(cycleSettings);

  const recommendation = useMemo(() => {
    if (!cycleSummary) {
      return null;
    }

    return recommendations[cycleSummary.phase];
  }, [cycleSummary]);

  useEffect(() => {
    let isMounted = true;

    async function loadDailyProgress() {
      try {
        const state = await getDailyProgressLogState(todayKey);
        if (isMounted) {
          setDailyProgressState(state);
        }
      } catch {
        if (isMounted) {
          setDailyProgressState(createEmptyDailyProgressState());
        }
      } finally {
        if (isMounted) {
          setDailyProgressLoaded(true);
        }
      }
    }

    setDailyProgressLoaded(false);
    void loadDailyProgress();

    return () => {
      isMounted = false;
    };
  }, [todayKey]);

  function updateDailyProgress(input: { moodLevel?: number | null; energyLevel?: number | null }) {
    const optimisticState = mergeDailyProgressState(dailyProgressState, {
      logDate: todayKey,
      ...input
    });

    latestSaveRequestIdRef.current += 1;
    const requestId = latestSaveRequestIdRef.current;
    setDailyProgressState(optimisticState);

    if (isDemoMode) {
      setDailyProgressState({
        ...optimisticState,
        syncStatus: "synced"
      });
      return;
    }

    void saveDailyProgressLog({
      logDate: todayKey,
      moodLevel: optimisticState.entry?.mood_level ?? null,
      energyLevel: optimisticState.entry?.energy_level ?? null
    })
      .then((state) => {
        if (latestSaveRequestIdRef.current === requestId) {
          setDailyProgressState(state);
        }
      })
      .catch(() => {
        if (latestSaveRequestIdRef.current === requestId) {
          setDailyProgressState(optimisticState);
        }
      });
  }

  return {
    profile,
    cycleState,
    cycleSummary,
    cycleSettings,
    recommendation,
    dailyProgressState,
    moodLevel: dailyProgressState.entry?.mood_level ?? null,
    energyLevel: dailyProgressState.entry?.energy_level ?? null,
    setMoodLevel: (value: number) => updateDailyProgress({ moodLevel: value }),
    setEnergyLevel: (value: number) => updateDailyProgress({ energyLevel: value }),
    loading: !dailyProgressLoaded || (!isDemoMode && (cycleQuery.isLoading || profileQuery.isLoading)),
    isDemoMode
  };
}
