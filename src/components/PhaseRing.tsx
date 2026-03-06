import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { AppText } from "@/components/AppText";
import { useThemeColors } from "@/theme/ThemeProvider";
import { getColorsForPhase } from "@/theme/tokens";
import type { CyclePhase } from "@/utils/constants";

type PhaseRingProps = {
  dayInCycle: number;
  cycleLengthDays: number;
  phaseLabel: string;
  periodLengthDays?: number;
  size?: number;
};

type PhaseSegment = {
  phase: CyclePhase;
  startDay: number;
  endDay: number;
};

const legendOrder: CyclePhase[] = ["menstrual", "follicular", "ovulation", "luteal"];

export function PhaseRing({
  dayInCycle,
  cycleLengthDays,
  phaseLabel,
  periodLengthDays = 5,
  size = 220
}: PhaseRingProps) {
  const colors = useThemeColors();
  const baseStroke = 12;
  const activeStroke = 16;
  const activeOffset = 4;
  const radius = size / 2 - activeOffset - activeStroke / 2;
  const center = size / 2;

  const segments = useMemo(
    () => buildPhaseSegments(cycleLengthDays, periodLengthDays),
    [cycleLengthDays, periodLengthDays]
  );
  const activeSegment = useMemo(
    () => segments.find((segment) => dayInCycle >= segment.startDay && dayInCycle <= segment.endDay) ?? null,
    [dayInCycle, segments]
  );
  const markerPosition = useMemo(
    () => positionForDay(dayInCycle, cycleLengthDays, center, activeSegment ? radius + activeOffset : radius),
    [dayInCycle, cycleLengthDays, center, radius, activeOffset, activeSegment]
  );
  const markerColor = activeSegment ? colorForSegment(activeSegment.phase) : colors.primarySoft;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={radius} stroke={colors.border} strokeWidth={baseStroke} fill="none" />
        {segments
          .filter((segment) => segment !== activeSegment)
          .map((segment) => (
            <Path
              key={`${segment.phase}-${segment.startDay}-${segment.endDay}`}
              d={createArcPath(center, radius, segment.startDay, segment.endDay, cycleLengthDays)}
              stroke={colorForSegment(segment.phase)}
              strokeWidth={baseStroke}
              strokeOpacity={0.78}
              fill="none"
              strokeLinecap="round"
            />
          ))}
        {activeSegment ? (
          <Path
            d={createArcPath(center, radius + activeOffset, activeSegment.startDay, activeSegment.endDay, cycleLengthDays)}
            stroke={colors.surface}
            strokeWidth={activeStroke + 5}
            fill="none"
            strokeLinecap="round"
          />
        ) : null}
        {activeSegment ? (
          <Path
            d={createArcPath(center, radius + activeOffset, activeSegment.startDay, activeSegment.endDay, cycleLengthDays)}
            stroke={colorForSegment(activeSegment.phase)}
            strokeWidth={activeStroke}
            fill="none"
            strokeLinecap="round"
          />
        ) : null}
        <Circle cx={markerPosition.x} cy={markerPosition.y} r={6} fill={colors.surface} stroke={markerColor} strokeWidth={2} />
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

function buildPhaseSegments(cycleLengthDays: number, periodLengthDays: number): PhaseSegment[] {
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

function positionForDay(day: number, totalDays: number, center: number, radius: number): { x: number; y: number } {
  const normalizedDay = clamp(day, 1, totalDays);
  const angle = -90 + ((normalizedDay - 0.5) / totalDays) * 360;

  return polarToCartesian(center, center, radius, angle);
}

function createArcPath(center: number, radius: number, startDay: number, endDay: number, totalDays: number): string {
  const startAngle = -90 + ((startDay - 1) / totalDays) * 360;
  const endAngle = -90 + (endDay / totalDays) * 360;
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

function colorForSegment(phase: CyclePhase): string {
  return getColorsForPhase(phase).primarySoft;
}

function phaseLabelForLegend(phase: CyclePhase): string {
  return `${phase[0].toUpperCase()}${phase.slice(1)}`;
}

function addAlpha(hexColor: string, alpha: "1A" | "33"): string {
  if (/^#[0-9a-fA-F]{6}$/.test(hexColor)) {
    return `${hexColor}${alpha}`;
  }

  return hexColor;
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
  },
  legendWrap: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    rowGap: 8,
    columnGap: 8
  },
  legendChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5
  }
});
