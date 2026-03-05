import type { PropsWithChildren } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

import { colors, radius, shadows, spacing } from "@/theme/tokens";

export function AppCard({ children, style, ...props }: PropsWithChildren<ViewProps>) {
  return (
    <View {...props} style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card
  }
});
