import { createContext, useContext, useMemo, type PropsWithChildren } from "react";
import { useColorScheme } from "react-native";

import { useQuery } from "@tanstack/react-query";

import { computeCycleSummary } from "@/features/cycle/cycleCalculator";
import { getCycleSettingsState } from "@/services/supabase/cycleService";
import { useAuthStore } from "@/store/authStore";
import { useDemoStore } from "@/store/demoStore";
import { useDemoMode } from "@/utils/demoMode";
import { getColorsForPhase, defaultColors, type ThemeColors, type ThemeMode } from "@/theme/tokens";

import type { CyclePhase } from "@/utils/constants";

type ThemeContextValue = {
  colors: ThemeColors;
  phase: CyclePhase | null;
  isDark: boolean;
  mode: ThemeMode;
};

const ThemeContext = createContext<ThemeContextValue>({
  colors: defaultColors,
  phase: null,
  isDark: false,
  mode: "light"
});

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemColorScheme = useColorScheme();
  const isDemoMode = useDemoMode();
  const session = useAuthStore((state) => state.session);
  const demoCycleSettings = useDemoStore((state) => state.cycleState.settings);
  const mode: ThemeMode = systemColorScheme === "dark" ? "dark" : "light";

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
      colors: getColorsForPhase(phase, mode),
      phase,
      isDark: mode === "dark",
      mode
    }),
    [mode, phase]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeColors(): ThemeColors {
  return useContext(ThemeContext).colors;
}

export function useThemePhase(): CyclePhase | null {
  return useContext(ThemeContext).phase;
}

export function useThemeMode(): ThemeMode {
  return useContext(ThemeContext).mode;
}

export function useIsDarkMode(): boolean {
  return useContext(ThemeContext).isDark;
}
