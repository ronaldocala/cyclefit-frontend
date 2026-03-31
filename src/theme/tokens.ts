import type { CyclePhase } from "@/utils/constants";

export type ThemeMode = "light" | "dark";

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
  onPrimary: string;
  onAccent: string;
  overlay: string;
  surfaceOverlay: string;
  success: string;
  warning: string;
  error: string;
};

type PhasePalette = Record<ThemeMode, ThemeColors>;

const menstrualColors: PhasePalette = {
  light: {
    primary: "#D9725A",
    primarySoft: "#E99584",
    sage: "#F3C8BC",
    background: "#FFF4EF",
    surface: "#FFF9F6",
    surfaceMuted: "#F8E7E0",
    border: "#E7CAC1",
    textPrimary: "#331F19",
    textSecondary: "#7F5B53",
    textMuted: "#A78981",
    onPrimary: "#FFF8F4",
    onAccent: "#7B4032",
    overlay: "rgba(20, 13, 12, 0.28)",
    surfaceOverlay: "rgba(255, 249, 246, 0.78)",
    success: "#2E7D32",
    warning: "#B26A00",
    error: "#B91C1C"
  },
  dark: {
    primary: "#F08C75",
    primarySoft: "#F4B3A4",
    sage: "#6F4238",
    background: "#1A1110",
    surface: "#241817",
    surfaceMuted: "#30211F",
    border: "#5E3C35",
    textPrimary: "#FFF2EE",
    textSecondary: "#E3C2BA",
    textMuted: "#B8958D",
    onPrimary: "#2C1510",
    onAccent: "#FFF4F1",
    overlay: "rgba(0, 0, 0, 0.56)",
    surfaceOverlay: "rgba(36, 24, 23, 0.9)",
    success: "#69C16F",
    warning: "#E8B04D",
    error: "#FF8A80"
  }
};

const follicularColors: PhasePalette = {
  light: {
    primary: "#6B7A32",
    primarySoft: "#92A657",
    sage: "#D6DEB1",
    background: "#F6F7EE",
    surface: "#FBFCF6",
    surfaceMuted: "#EEF1DF",
    border: "#D7DDC0",
    textPrimary: "#283015",
    textSecondary: "#5F6942",
    textMuted: "#8B946D",
    onPrimary: "#F8FAEF",
    onAccent: "#46511F",
    overlay: "rgba(16, 18, 10, 0.26)",
    surfaceOverlay: "rgba(251, 252, 246, 0.8)",
    success: "#2E7D32",
    warning: "#B26A00",
    error: "#B91C1C"
  },
  dark: {
    primary: "#A8BA66",
    primarySoft: "#C3CF90",
    sage: "#4A5624",
    background: "#12150C",
    surface: "#1B2011",
    surfaceMuted: "#252C18",
    border: "#48542A",
    textPrimary: "#F4F7E8",
    textSecondary: "#CCD5AB",
    textMuted: "#9CA67C",
    onPrimary: "#1A200E",
    onAccent: "#F4F7E8",
    overlay: "rgba(0, 0, 0, 0.55)",
    surfaceOverlay: "rgba(27, 32, 17, 0.9)",
    success: "#69C16F",
    warning: "#E8B04D",
    error: "#FF8A80"
  }
};

const ovulationColors: PhasePalette = {
  light: {
    primary: "#C9A02E",
    primarySoft: "#D9B85D",
    sage: "#F1E0A2",
    background: "#FCF7E8",
    surface: "#FFFDF7",
    surfaceMuted: "#F7EFD2",
    border: "#E7D8A2",
    textPrimary: "#33280F",
    textSecondary: "#7A6532",
    textMuted: "#A28B57",
    onPrimary: "#342607",
    onAccent: "#725A14",
    overlay: "rgba(21, 17, 8, 0.26)",
    surfaceOverlay: "rgba(255, 253, 247, 0.8)",
    success: "#2E7D32",
    warning: "#9F6D00",
    error: "#B91C1C"
  },
  dark: {
    primary: "#E0C15B",
    primarySoft: "#ECD98C",
    sage: "#715C1D",
    background: "#191509",
    surface: "#241E0F",
    surfaceMuted: "#2F2714",
    border: "#5B4C1C",
    textPrimary: "#FFF8E8",
    textSecondary: "#E4D39A",
    textMuted: "#B9A86E",
    onPrimary: "#312405",
    onAccent: "#FFF8E8",
    overlay: "rgba(0, 0, 0, 0.56)",
    surfaceOverlay: "rgba(36, 30, 15, 0.9)",
    success: "#69C16F",
    warning: "#F0C35C",
    error: "#FF8A80"
  }
};

const lutealColors: PhasePalette = {
  light: {
    primary: "#3A3675",
    primarySoft: "#655EAE",
    sage: "#C8C3EA",
    background: "#F3F1FB",
    surface: "#FAF9FE",
    surfaceMuted: "#ECE8F8",
    border: "#D5D0EA",
    textPrimary: "#1B1837",
    textSecondary: "#58527C",
    textMuted: "#8D87AF",
    onPrimary: "#F8F7FF",
    onAccent: "#2F2A68",
    overlay: "rgba(12, 11, 26, 0.28)",
    surfaceOverlay: "rgba(250, 249, 254, 0.8)",
    success: "#2E7D32",
    warning: "#B26A00",
    error: "#B91C1C"
  },
  dark: {
    primary: "#9189E5",
    primarySoft: "#B4ADF2",
    sage: "#4B4694",
    background: "#11111F",
    surface: "#1A1930",
    surfaceMuted: "#242247",
    border: "#504B8A",
    textPrimary: "#F2F0FF",
    textSecondary: "#CEC9F0",
    textMuted: "#A6A0D3",
    onPrimary: "#141328",
    onAccent: "#F3F1FF",
    overlay: "rgba(0, 0, 0, 0.58)",
    surfaceOverlay: "rgba(26, 25, 48, 0.9)",
    success: "#69C16F",
    warning: "#E8B04D",
    error: "#FF8A80"
  }
};

const phaseColorPalettes: Record<CyclePhase, PhasePalette> = {
  menstrual: menstrualColors,
  follicular: follicularColors,
  ovulation: ovulationColors,
  luteal: lutealColors
};

export const defaultColors: ThemeColors = follicularColors.light;

export function getColorsForPhase(phase: CyclePhase | null | undefined, mode: ThemeMode = "light"): ThemeColors {
  if (!phase) {
    return phaseColorPalettes.follicular[mode];
  }

  return phaseColorPalettes[phase][mode];
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
