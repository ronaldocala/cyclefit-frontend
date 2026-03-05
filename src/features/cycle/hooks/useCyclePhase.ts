import { useMemo } from "react";

import { computeCycleSummary } from "@/features/cycle/cycleCalculator";
import { useAppStore } from "@/store/appStore";
import type { CycleSettings } from "@/api/types";

export function useCyclePhase(settings: CycleSettings | null) {
  const phaseOverride = useAppStore((state) => state.phaseOverride);

  return useMemo(() => {
    if (!settings) {
      return null;
    }

    const summary = computeCycleSummary(settings);

    if (!phaseOverride) {
      return summary;
    }

    return {
      ...summary,
      phase: phaseOverride,
      phaseNote:
        phaseOverride === "menstrual"
          ? "Override is active, gentle movement and recovery are suggested."
          : phaseOverride === "follicular"
            ? "Override is active, moderate to high energy training can fit well."
            : phaseOverride === "ovulation"
              ? "Override is active, high output windows may feel easier."
              : "Override is active, keep training steady and support recovery."
    };
  }, [phaseOverride, settings]);
}
