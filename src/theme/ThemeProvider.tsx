import { createContext, useContext, useMemo, type PropsWithChildren } from "react";

import { useQuery } from "@tanstack/react-query";

import { computeCycleSummary } from "@/features/cycle/cycleCalculator";
import { getCycleSettingsState } from "@/services/supabase/cycleService";
import { useAuthStore } from "@/store/authStore";
import { useDemoStore } from "@/store/demoStore";
import { useDemoMode } from "@/utils/demoMode";
import { getColorsForPhase, defaultColors, type ThemeColors } from "@/theme/tokens";

import type { CyclePhase } from "@/utils/constants";

type ThemeContextValue = {
  colors: ThemeColors;
  phase: CyclePhase | null;
};

const ThemeContext = createContext<ThemeContextValue>({
  colors: defaultColors,
  phase: null
});

export function ThemeProvider({ children }: PropsWithChildren) {
  const isDemoMode = useDemoMode();
  const session = useAuthStore((state) => state.session);
  const demoCycleSettings = useDemoStore((state) => state.cycleState.settings);

  const cycleQuery = useQuery({
    queryKey: ["cycleSettings"],
    queryFn: getCycleSettingsState,
    enabled: !isDemoMode && Boolean(session)
  });

  const cycleSettings = isDemoMode ? demoCycleSettings : (cycleQuery.data?.settings ?? null);

  const phase = useMemo(() => {
    if (!cycleSettings) {
      return null;
    }

    return computeCycleSummary(cycleSettings).phase;
  }, [cycleSettings]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: getColorsForPhase(phase),
      phase
    }),
    [phase]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeColors(): ThemeColors {
  return useContext(ThemeContext).colors;
}

export function useThemePhase(): CyclePhase | null {
  return useContext(ThemeContext).phase;
}
