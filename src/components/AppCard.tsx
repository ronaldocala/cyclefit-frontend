import { useMemo, type PropsWithChildren } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

import { useThemeColors } from "@/theme/ThemeProvider";
import { radius, shadows, spacing, type ThemeColors } from "@/theme/tokens";

export function AppCard({ children, style, ...props }: PropsWithChildren<ViewProps>) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View {...props} style={[styles.card, style]}>
      {children}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      ...shadows.card
    }
  });
