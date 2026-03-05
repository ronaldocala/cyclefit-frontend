import type { ReactNode } from "react";
import { Pressable, type PressableProps, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { AppText } from "@/components/AppText";
import { colors, radius, spacing } from "@/theme/tokens";

type Variant = "primary" | "secondary" | "outline" | "ghost";

type AppButtonProps = Omit<PressableProps, "style"> & {
  label: string;
  variant?: Variant;
  rightSlot?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function AppButton({ label, variant = "primary", style, rightSlot, ...props }: AppButtonProps) {
  return (
    <Pressable {...props} style={[styles.base, styles[variant], style]}>
      <View style={styles.labelRow}>
        <AppText variant="bodyStrong" style={[styles.label, variant === "primary" ? styles.labelPrimary : undefined]}>
          {label}
        </AppText>
        {rightSlot}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl
  },
  primary: {
    backgroundColor: colors.primary
  },
  secondary: {
    backgroundColor: colors.sage
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border
  },
  ghost: {
    backgroundColor: "transparent"
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  label: {
    color: colors.primary
  },
  labelPrimary: {
    color: colors.surface
  }
});
