import type { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing } from "@/theme/tokens";

type ScreenContainerProps = PropsWithChildren<{
  contentContainerStyle?: ViewStyle;
}>;

export function ScreenContainer({ children, contentContainerStyle }: ScreenContainerProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.content, contentContainerStyle]}>{children}</ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg
  }
});
