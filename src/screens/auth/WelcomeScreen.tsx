import { MaterialIcons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppText } from "@/components/AppText";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useThemeColors } from "@/theme/ThemeProvider";
import { radius, spacing, type ThemeColors } from "@/theme/tokens";

import type { AuthStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

const heroUri =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDHmrCBZolU2VBB-X2egDK_UTqKJ1AdmiBR-PxHwddGXxljRm_96RqLRPx9l6qTNrfCcsFGeaMSp3nsO9jwMwKienkiuyWs-d_B3BniXm9zDhfehflI3FkQ9eSWw90cJRtoWKFcYm5gfOwzfSpmPr0tzCjjGIC_YlzUIt2vjfea6loLK3L1iFdppM2ejiRZyqecTWqhKk4LNBZdxPcxexRyvi8LTde9ap6fppdnMpz1n0JYLXAJu8KvBl7CtqD7ckFnRjBiCh84pDA";

export function WelcomeScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <MaterialIcons name="favorite" color={colors.onPrimary} size={16} />
          </View>
          <AppText variant="bodyStrong" muted>
            CycleFit+
          </AppText>
        </View>
      </View>

      <Image source={{ uri: heroUri }} style={styles.hero} />

      <View style={styles.titleBlock}>
        <AppText variant="h1">Welcome to</AppText>
        <AppText variant="h1" style={styles.brandText}>
          CycleFit+
        </AppText>
        <AppText variant="subtitle" muted>
          Daily fitness guidance that respects your body's natural rhythm.
        </AppText>
      </View>

      <View style={styles.actions}>
        <AppButton label="Get Started" onPress={() => navigation.navigate("SignIn")} />
        <AppButton label="Learn More" variant="secondary" onPress={() => navigation.navigate("SignIn")} />
      </View>

      <View style={styles.membersRow}>
        <View style={styles.avatarStack}>
          <View style={[styles.avatar, { backgroundColor: "#A36E3A" }]} />
          <View style={[styles.avatar, { backgroundColor: "#C58B4D", marginLeft: -8 }]} />
          <View style={[styles.avatar, { backgroundColor: "#D2A274", marginLeft: -8 }]} />
        </View>
        <AppText variant="caption" muted>
          Join 10,000+ members
        </AppText>
      </View>

      <AppText variant="overline" muted style={styles.est}>
        EST. 2024
      </AppText>
    </ScreenContainer>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      paddingTop: spacing.lg,
      gap: spacing.xl
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center"
    },
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    brandIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center"
    },
    hero: {
      width: "100%",
      height: 360,
      borderRadius: radius.lg
    },
    titleBlock: {
      gap: spacing.sm
    },
    brandText: {
      color: colors.primarySoft,
      marginTop: -8
    },
    actions: {
      gap: spacing.md
    },
    membersRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md
    },
    avatarStack: {
      flexDirection: "row",
      alignItems: "center"
    },
    avatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.background
    },
    est: {
      textAlign: "center"
    }
  });
