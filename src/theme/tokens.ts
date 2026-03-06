import type { CyclePhase } from "@/utils/constants";

export type ThemeColors = {
  primary: string;
  primarySoft: string;
  sage: string;
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  success: string;
  warning: string;
  error: string;
};

const follicularColors: ThemeColors = {
  primary: "#1F3F3E",
  primarySoft: "#4E6E6D",
  sage: "#AEBFB4",
  background: "#F7F5F2",
  surface: "#FFFFFF",
  surfaceMuted: "#EFEAE4",
  border: "#DDE3DF",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  success: "#2E7D32",
  warning: "#B26A00",
  error: "#B91C1C"
};

const menstrualColors: ThemeColors = {
  primary: "#7A3E58",
  primarySoft: "#A2607B",
  sage: "#E0B9C8",
  background: "#FFF6F8",
  surface: "#FFFFFF",
  surfaceMuted: "#F6E8EE",
  border: "#EAD5DE",
  textPrimary: "#321D27",
  textSecondary: "#7D5A69",
  textMuted: "#A98795",
  success: "#2E7D32",
  warning: "#B26A00",
  error: "#B91C1C"
};

const ovulationColors: ThemeColors = {
  primary: "#874715",
  primarySoft: "#B76B2C",
  sage: "#F0C79D",
  background: "#FFF8F2",
  surface: "#FFFFFF",
  surfaceMuted: "#F7EBDD",
  border: "#EEDBC7",
  textPrimary: "#322012",
  textSecondary: "#7A5A41",
  textMuted: "#A6866A",
  success: "#2E7D32",
  warning: "#B26A00",
  error: "#B91C1C"
};

const lutealColors: ThemeColors = {
  primary: "#355165",
  primarySoft: "#4F6D82",
  sage: "#B8CBD7",
  background: "#F5F8FB",
  surface: "#FFFFFF",
  surfaceMuted: "#E8EEF3",
  border: "#D6E1EA",
  textPrimary: "#142331",
  textSecondary: "#5C7082",
  textMuted: "#8798A7",
  success: "#2E7D32",
  warning: "#B26A00",
  error: "#B91C1C"
};

const phaseColorPalettes: Record<CyclePhase, ThemeColors> = {
  menstrual: menstrualColors,
  follicular: follicularColors,
  ovulation: ovulationColors,
  luteal: lutealColors
};

export const defaultColors: ThemeColors = follicularColors;

export function getColorsForPhase(phase: CyclePhase | null | undefined): ThemeColors {
  if (!phase) {
    return defaultColors;
  }

  return phaseColorPalettes[phase];
}

export const colors = defaultColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999
} as const;

export const typography = {
  h1: { fontSize: 40, lineHeight: 46, fontWeight: "700" as const },
  h2: { fontSize: 34, lineHeight: 40, fontWeight: "700" as const },
  h3: { fontSize: 28, lineHeight: 34, fontWeight: "700" as const },
  title: { fontSize: 24, lineHeight: 30, fontWeight: "700" as const },
  subtitle: { fontSize: 18, lineHeight: 24, fontWeight: "600" as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400" as const },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: "600" as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "500" as const },
  overline: { fontSize: 12, lineHeight: 16, fontWeight: "700" as const, letterSpacing: 1.4 }
} as const;

export const shadows = {
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2
  }
} as const;
