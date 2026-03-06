import { useMemo } from "react";
import { Image, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { ScreenContainer } from "@/components/ScreenContainer";
import { presentCycleFitProPaywall } from "@/services/revenuecat/revenueCatService";
import { useThemeColors } from "@/theme/ThemeProvider";
import { spacing, type ThemeColors } from "@/theme/tokens";

const heroUri =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDAVl20wsFyOKW4WdQEh5PN_0YagD6GPnfVlIzxUmiMHqCqC9I_qyYfeAuSn5TpwAppsnWDvuuCZuUeBuirGqy5IwifNZxgcckXLYIWUVgCDHQxFhN1rVeRvWr3Fc6JI4wFmYLRqmAIBY0w8ihOhmAR5wg6_HzPc-I-4tOqYeXNRj_h5FCmAJVXN3H8vsdLQVCoKJUHsCy9J0B5QdX2cfATxVxuiIG_0WJGop1uKofXDolKR1LVx0zJBQ1W_GszJ_rtfUZkN9BBnNE";

const benefits = [
  "Custom workout plans",
  "Premade structured sessions",
  "Advanced progress insights"
] as const;

export function PremiumUpsellScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <AppCard style={styles.card}>
        <View style={styles.heroWrap}>
          <Image source={{ uri: heroUri }} style={styles.hero} />
          <View style={styles.badge}>
            <AppText variant="overline" style={styles.badgeText}>
              CYCLEFIT+
            </AppText>
          </View>
        </View>

        <View style={styles.body}>
          <AppText variant="h2" style={styles.title}>
            Unlock your full potential with Premium
          </AppText>
          <AppText variant="body" muted style={styles.subtitle}>
            Elevate your performance with tools designed for serious cyclists.
          </AppText>

          <View style={styles.benefits}>
            {benefits.map((benefit) => (
              <View key={benefit} style={styles.benefitRow}>
                <View style={styles.check} />
                <AppText variant="bodyStrong">{benefit}</AppText>
              </View>
            ))}
          </View>

          <View style={styles.priceCard}>
            <View style={styles.priceTop}>
              <AppText variant="caption" style={styles.priceLabel}>
                Annual Membership
              </AppText>
              <AppText variant="caption" muted>
                7 days free
              </AppText>
            </View>
            <View style={styles.priceRow}>
              <AppText variant="h2">$9.99</AppText>
              <AppText variant="body" muted>
                / month, billed annually
              </AppText>
            </View>
          </View>

          <AppButton
            label="View CycleFit+ Pro plans"
            onPress={() => {
              void presentCycleFitProPaywall();
            }}
          />
          <AppButton label="Skip for now" variant="ghost" />

          <AppText variant="caption" muted style={styles.footnote}>
            After 7 days, you will be charged $119.99 annually unless cancelled.
          </AppText>
        </View>
      </AppCard>
    </ScreenContainer>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      justifyContent: "center",
      flexGrow: 1
    },
    card: {
      padding: 0,
      overflow: "hidden"
    },
    heroWrap: {
      position: "relative"
    },
    hero: {
      width: "100%",
      height: 220
    },
    badge: {
      position: "absolute",
      top: spacing.lg,
      left: spacing.lg,
      backgroundColor: colors.primarySoft,
      borderRadius: 999,
      paddingHorizontal: spacing.md,
      paddingVertical: 6
    },
    badgeText: {
      color: colors.surface
    },
    body: {
      padding: spacing.xxl,
      gap: spacing.lg
    },
    title: {
      textAlign: "center"
    },
    subtitle: {
      textAlign: "center"
    },
    benefits: {
      gap: spacing.md
    },
    benefitRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    check: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.surfaceMuted,
      borderWidth: 2,
      borderColor: colors.sage
    },
    priceCard: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 12,
      padding: spacing.lg,
      gap: spacing.xs
    },
    priceTop: {
      flexDirection: "row",
      justifyContent: "space-between"
    },
    priceLabel: {
      color: colors.primarySoft
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: spacing.sm
    },
    footnote: {
      textAlign: "center"
    }
  });
