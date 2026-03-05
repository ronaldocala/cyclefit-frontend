import { differenceInCalendarDays } from "date-fns";

import type { CycleSettings } from "@/api/types";
import type { CyclePhase } from "@/utils/constants";
import { asDate } from "@/utils/date";

export type CycleSummary = {
  dayInCycle: number;
  cycleLengthDays: number;
  phase: CyclePhase;
  phaseNote: string;
};

const phaseNotes: Record<CyclePhase, string> = {
  menstrual: "Prioritize recovery, mobility, and lighter sessions.",
  follicular: "Energy is rising, this is a good window for strength work.",
  ovulation: "Peak output can feel easier, use this for high-intensity training.",
  luteal: "Maintain consistency with moderate intensity and more recovery support."
};

export function computeCycleSummary(settings: Pick<CycleSettings, "last_period_date" | "cycle_length_days" | "period_length_days">, today = new Date()): CycleSummary {
  const startDate = asDate(settings.last_period_date);
  const daysSinceStart = differenceInCalendarDays(today, startDate);
  const normalized = ((daysSinceStart % settings.cycle_length_days) + settings.cycle_length_days) % settings.cycle_length_days;
  const dayInCycle = normalized + 1;

  let phase: CyclePhase = "luteal";

  if (dayInCycle <= settings.period_length_days) {
    phase = "menstrual";
  } else {
    const ovulationCenter = settings.cycle_length_days - 14;
    const ovulationStart = Math.max(ovulationCenter - 1, settings.period_length_days + 1);
    const ovulationEnd = Math.min(ovulationCenter + 1, settings.cycle_length_days);

    if (dayInCycle < ovulationStart) {
      phase = "follicular";
    } else if (dayInCycle <= ovulationEnd) {
      phase = "ovulation";
    } else {
      phase = "luteal";
    }
  }

  return {
    dayInCycle,
    cycleLengthDays: settings.cycle_length_days,
    phase,
    phaseNote: phaseNotes[phase]
  };
}
