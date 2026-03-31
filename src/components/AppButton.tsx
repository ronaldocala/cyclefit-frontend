import { useMemo, type ReactNode } from "react";
import { Pressable, type PressableProps, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { AppText } from "@/components/AppText";
import { useThemeColors } from "@/theme/ThemeProvider";
import { radius, spacing, type ThemeColors } from "@/theme/tokens";

type Variant = "primary" | "secondary" | "outline" | "ghost";

type AppButtonProps = Omit<PressableProps, "style"> & {
  label: string;
  variant?: Variant;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function AppButton({ label, variant = "primary", style, leftSlot, rightSlot, ...props }: AppButtonProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable {...props} style={[styles.base, styles[variant], style]}>
      <View style={styles.labelRow}>
        {leftSlot}
        <AppText
          variant="bodyStrong"
          style={[
            styles.label,
            variant === "primary" ? styles.labelPrimary : undefined,
            variant === "secondary" ? styles.labelSecondary : undefined
          ]}
        >
          {label}
        </AppText>
        {rightSlot}
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      color: colors.onPrimary
    },
    labelSecondary: {
      color: colors.onAccent
    }
  });
