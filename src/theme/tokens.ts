export const colors = {
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
} as const;

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
