import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { AppText } from "@/components/AppText";
import { useThemeColors, useThemeMode } from "@/theme/ThemeProvider";
import { getColorsForPhase } from "@/theme/tokens";
import type { CyclePhase } from "@/utils/constants";

type PhaseRingProps = {
  dayInCycle: number;
  cycleLengthDays: number;
  phaseLabel: string;
  periodLengthDays?: number;
  size?: number;
};

type PhaseArc = {
  startDay: number;
  endDay: number;
  color: string;
};

type PhaseSegment = {
  phase: CyclePhase;
  startDay: number;
  endDay: number;
};

export function PhaseRing({
  dayInCycle,
  cycleLengthDays,
  phaseLabel,
  periodLengthDays = 5,
  size = 220
}: PhaseRingProps) {
  const colors = useThemeColors();
  const mode = useThemeMode();
  const baseStroke = 12;
  const currentDayStroke = 14;
  const currentDayOffset = 3;
  const currentDaySpan = 0.9;
  const radius = size / 2 - 6 - currentDayOffset - currentDayStroke / 2;
  const center = size / 2;

  const segments = useMemo(
    () => buildCycleWindows(cycleLengthDays, periodLengthDays),
    [cycleLengthDays, periodLengthDays]
  );
  const phaseArcs = useMemo(() => buildPhaseArcs(segments, mode), [mode, segments]);
  const activeSegment = useMemo(
    () => segments.find((segment) => dayInCycle >= segment.startDay && dayInCycle <= segment.endDay) ?? null,
    [dayInCycle, segments]
  );
  const currentDayStart = clamp(dayInCycle - currentDaySpan / 2, 1, cycleLengthDays);
  const currentDayEnd = clamp(dayInCycle + currentDaySpan / 2, 1, cycleLengthDays + 1);
  const currentDayArcs = useMemo(
    () => buildPhaseArcs(segments, mode, currentDayStart, currentDayEnd),
    [currentDayEnd, currentDayStart, mode, segments]
  );

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {phaseArcs.map((arc) => (
          <Path
            key={`${arc.startDay}-${arc.endDay}`}
            d={createArcPath(center, radius, arc.startDay, arc.endDay, cycleLengthDays)}
            stroke={arc.color}
            strokeWidth={baseStroke}
            fill="none"
            strokeLinecap="butt"
          />
        ))}
        {activeSegment ? (
          <Path
            d={createArcPath(center, radius + currentDayOffset, currentDayStart, currentDayEnd, cycleLengthDays)}
            stroke={colors.surface}
            strokeWidth={currentDayStroke + 4}
            fill="none"
            strokeLinecap="round"
          />
        ) : null}
        {activeSegment
          ? currentDayArcs.map((arc) => (
              <Path
                key={`active-${arc.startDay}-${arc.endDay}`}
                d={createArcPath(center, radius + currentDayOffset, arc.startDay, arc.endDay, cycleLengthDays)}
                stroke={arc.color}
                strokeWidth={currentDayStroke}
                fill="none"
                strokeLinecap="round"
              />
            ))
          : null}
      </Svg>
      <View style={styles.center}>
        <AppText variant="subtitle">Day {dayInCycle}</AppText>
        <AppText variant="caption" muted>
          of {cycleLengthDays}
        </AppText>
        <AppText variant="title" style={styles.phase}>
          {phaseLabel}
        </AppText>
      </View>
    </View>
  );
}

function buildPhaseArcs(
  segments: PhaseSegment[],
  mode: "light" | "dark",
  startDay = 1,
  endDay = Number.POSITIVE_INFINITY
): PhaseArc[] {
  return segments.flatMap((segment) => {
    const clippedStart = Math.max(segment.startDay, startDay);
    const clippedEnd = Math.min(segment.endDay + 1, endDay);

    if (clippedStart >= clippedEnd) {
      return [];
    }

    return [
      {
        startDay: clippedStart,
        endDay: clippedEnd,
        color: getColorsForPhase(segment.phase, mode).primarySoft
      }
    ];
  });
}

function buildCycleWindows(cycleLengthDays: number, periodLengthDays: number): PhaseSegment[] {
  const boundedPeriod = clamp(periodLengthDays, 1, cycleLengthDays);
  const ovulationCenter = cycleLengthDays - 14;
  const ovulationStart = clamp(Math.max(ovulationCenter - 1, boundedPeriod + 1), 1, cycleLengthDays);
  const ovulationEnd = clamp(Math.min(ovulationCenter + 1, cycleLengthDays), 1, cycleLengthDays);
  const segments: PhaseSegment[] = [
    { phase: "menstrual", startDay: 1, endDay: boundedPeriod },
    { phase: "follicular", startDay: boundedPeriod + 1, endDay: ovulationStart - 1 },
    { phase: "ovulation", startDay: ovulationStart, endDay: ovulationEnd },
    { phase: "luteal", startDay: ovulationEnd + 1, endDay: cycleLengthDays }
  ];

  return segments.filter((segment) => segment.startDay <= segment.endDay);
}

function createArcPath(center: number, radius: number, startDay: number, endDay: number, totalDays: number): string {
  const startAngle = -90 + ((startDay - 1) / totalDays) * 360;
  const endAngle = -90 + ((endDay - 1) / totalDays) * 360;
  const start = polarToCartesian(center, center, radius, startAngle);
  const end = polarToCartesian(center, center, radius, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleDeg: number): { x: number; y: number } {
  const angleRad = (angleDeg * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleRad),
    y: centerY + radius * Math.sin(angleRad)
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center"
  },
  center: {
    position: "absolute",
    alignItems: "center"
  },
  phase: {
    marginTop: 8,
    textAlign: "center"
  }
});
