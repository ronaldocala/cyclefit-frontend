import { useMemo } from "react";
import { Text, type TextProps, StyleSheet } from "react-native";

import { useThemeColors } from "@/theme/ThemeProvider";
import { typography, type ThemeColors } from "@/theme/tokens";

type Variant = "h1" | "h2" | "title" | "subtitle" | "body" | "bodyStrong" | "caption" | "overline";

type AppTextProps = TextProps & {
  variant?: Variant;
  muted?: boolean;
};

export function AppText({ variant = "body", muted = false, style, ...props }: AppTextProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return <Text {...props} style={[styles.base, styles[variant], muted ? styles.muted : undefined, style]} />;
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    base: {
      color: colors.textPrimary
    },
    muted: {
      color: colors.textSecondary
    },
    h1: typography.h1,
    h2: typography.h2,
    title: typography.title,
    subtitle: typography.subtitle,
    body: typography.body,
    bodyStrong: typography.bodyStrong,
    caption: typography.caption,
    overline: typography.overline
  });
