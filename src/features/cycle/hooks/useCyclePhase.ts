import { useMemo } from "react";

import type { CycleSettings } from "@/api/types";
import { computeCycleSummary } from "@/features/cycle/cycleCalculator";

export function useCyclePhase(settings: CycleSettings | null) {
  return useMemo(() => {
    if (!settings) {
      return null;
    }

    return computeCycleSummary(settings);
  }, [settings]);
}
