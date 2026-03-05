import { StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { AppText } from "@/components/AppText";
import { colors } from "@/theme/tokens";

type PhaseRingProps = {
  dayInCycle: number;
  cycleLengthDays: number;
  phaseLabel: string;
  size?: number;
};

export function PhaseRing({ dayInCycle, cycleLengthDays, phaseLabel, size = 220 }: PhaseRingProps) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(dayInCycle / cycleLengthDays, 1);
  const dashOffset = circumference * (1 - progress);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.border} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.sage}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
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
