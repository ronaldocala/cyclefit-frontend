import { addDays, differenceInCalendarDays } from "date-fns";

import type { CycleSettings } from "@/api/types";
import type { CyclePhase } from "@/utils/constants";
import { asDate, toIsoDate } from "@/utils/date";

export type CyclePhaseSegment = {
  phase: CyclePhase;
  startDay: number;
  endDay: number;
};

export type CycleSummary = {
  dayInCycle: number;
  cycleLengthDays: number;
  phase: CyclePhase;
  phaseLabel: string;
  phaseNote: string;
  trainingFocus: string;
  recoveryFocus: string;
  nextPeriodDate: string;
  nextOvulationDate: string;
  fertileWindowStart: string;
  fertileWindowEnd: string;
  daysUntilNextPeriod: number;
  daysUntilNextOvulation: number;
};

export type PhaseDescriptor = Pick<CycleSummary, "phaseLabel" | "phaseNote" | "trainingFocus" | "recoveryFocus">;

const phaseDescriptors: Record<CyclePhase, PhaseDescriptor> = {
  menstrual: {
    phaseLabel: "Menstrual",
    phaseNote: "Prioritize recovery, mobility, and lighter sessions.",
    trainingFocus: "Recovery rides, mobility, and low-pressure consistency.",
    recoveryFocus: "Lean into sleep, iron-rich meals, and lighter training stress."
  },
  follicular: {
    phaseLabel: "Follicular",
    phaseNote: "Energy is rising, this is a good window for strength work.",
    trainingFocus: "Build strength, increase volume, and test higher output.",
    recoveryFocus: "Keep protein high and use the extra energy for progression."
  },
  ovulation: {
    phaseLabel: "Ovulation",
    phaseNote: "Peak output can feel easier, use this for high-intensity training.",
    trainingFocus: "Short power sessions, speed work, and heavy compound lifts.",
    recoveryFocus: "Hydrate aggressively and keep recovery quality high after hard efforts."
  },
  luteal: {
    phaseLabel: "Luteal",
    phaseNote: "Maintain consistency with moderate intensity and more recovery support.",
    trainingFocus: "Steady endurance, controlled tempo work, and repeatable sessions.",
    recoveryFocus: "Reduce all-out work if energy drops and favor sleep and fueling."
  }
};

export function getCyclePhaseDescriptor(phase: CyclePhase): PhaseDescriptor {
  return phaseDescriptors[phase];
}

export function buildCyclePhaseSegments(cycleLengthDays: number, periodLengthDays: number): CyclePhaseSegment[] {
  const boundedCycleLength = Math.max(cycleLengthDays, 1);
  const boundedPeriodLength = clamp(periodLengthDays, 1, boundedCycleLength);
  const ovulationCenter = boundedCycleLength - 14;
  const ovulationStart = clamp(Math.max(ovulationCenter - 1, boundedPeriodLength + 1), 1, boundedCycleLength);
  const ovulationEnd = clamp(Math.min(ovulationCenter + 1, boundedCycleLength), 1, boundedCycleLength);

  const segments: CyclePhaseSegment[] = [
    { phase: "menstrual", startDay: 1, endDay: boundedPeriodLength },
    { phase: "follicular", startDay: boundedPeriodLength + 1, endDay: ovulationStart - 1 },
    { phase: "ovulation", startDay: ovulationStart, endDay: ovulationEnd },
    { phase: "luteal", startDay: ovulationEnd + 1, endDay: boundedCycleLength }
  ];

  return segments.filter((segment) => segment.startDay <= segment.endDay);
}

export function computeCycleSummary(
  settings: Pick<CycleSettings, "last_period_date" | "cycle_length_days" | "period_length_days">,
  today = new Date()
): CycleSummary {
  const startDate = asDate(settings.last_period_date);
  const daysSinceStart = differenceInCalendarDays(today, startDate);
  const normalized = ((daysSinceStart % settings.cycle_length_days) + settings.cycle_length_days) % settings.cycle_length_days;
  const dayInCycle = normalized + 1;
  const phaseSegments = buildCyclePhaseSegments(settings.cycle_length_days, settings.period_length_days);
  const phase = phaseSegments.find((segment) => dayInCycle >= segment.startDay && dayInCycle <= segment.endDay)?.phase ?? "luteal";

  const nextPeriodOffset = settings.cycle_length_days - normalized;
  const ovulationDay = Math.min(Math.max(settings.cycle_length_days - 14, settings.period_length_days + 1), settings.cycle_length_days);
  const ovulationOffset = ((ovulationDay - dayInCycle) % settings.cycle_length_days + settings.cycle_length_days) % settings.cycle_length_days;
  const nextOvulationDate = addDays(today, ovulationOffset);
  const descriptor = getCyclePhaseDescriptor(phase);

  return {
    dayInCycle,
    cycleLengthDays: settings.cycle_length_days,
    phase,
    phaseLabel: descriptor.phaseLabel,
    phaseNote: descriptor.phaseNote,
    trainingFocus: descriptor.trainingFocus,
    recoveryFocus: descriptor.recoveryFocus,
    nextPeriodDate: toIsoDate(addDays(today, nextPeriodOffset)),
    nextOvulationDate: toIsoDate(nextOvulationDate),
    fertileWindowStart: toIsoDate(addDays(nextOvulationDate, -4)),
    fertileWindowEnd: toIsoDate(addDays(nextOvulationDate, 1)),
    daysUntilNextPeriod: nextPeriodOffset,
    daysUntilNextOvulation: ovulationOffset
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
