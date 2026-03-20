import * as AppleAuthentication from "expo-apple-authentication";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useAuthScreen } from "@/features/auth/hooks/useAuthScreen";
import { useAuthStore } from "@/store/authStore";
import { useThemeColors } from "@/theme/ThemeProvider";
import { radius, spacing, type ThemeColors } from "@/theme/tokens";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidOtp(value: string): boolean {
  return /^\d{6,10}$/.test(value.replace(/\s+/g, ""));
}

export function SignInScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { onSendEmailOtp, onVerifyEmailOtp, onResetEmailFlow, onSignInWithApple, onSignInWithGoogle, loading, message, error, pendingEmail } =
    useAuthScreen();
  const setDevSkipLogin = useAuthStore((state) => state.setDevSkipLogin);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    void AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  const activeEmail = pendingEmail ?? email.trim().toLowerCase();

  async function handleSendCode(): Promise<void> {
    if (!isValidEmail(email)) {
      setFormError("Enter a valid email address.");
      return;
    }

    setFormError(null);
    await onSendEmailOtp(email);
    setOtp("");
  }

  async function handleVerifyCode(): Promise<void> {
    if (!pendingEmail) {
      setFormError("Request a code before trying to verify.");
      return;
    }

    if (!isValidOtp(otp)) {
      setFormError("Enter the numeric code from your email.");
      return;
    }

    setFormError(null);
    await onVerifyEmailOtp(pendingEmail, otp);
  }

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <AppText variant="h2">Sign in or create your account</AppText>
          <AppText variant="body" muted>
            Continue with Google, Apple, or a Supabase email code.
          </AppText>
        </View>

        <View style={styles.form}>
          <AppButton
            label={loading ? "Please wait..." : "Continue with Google"}
            variant="outline"
            leftSlot={<FontAwesome name="google" size={18} color={colors.primary} />}
            disabled={loading}
            onPress={onSignInWithGoogle}
          />

          {appleAvailable ? (
            <AppButton
              label={loading ? "Please wait..." : "Continue with Apple"}
              variant="outline"
              leftSlot={<FontAwesome name="apple" size={20} color={colors.primary} />}
              disabled={loading}
              onPress={onSignInWithApple}
            />
          ) : null}

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <AppText variant="caption" muted>
              or use email
            </AppText>
            <View style={styles.dividerLine} />
          </View>

          <AppCard style={styles.emailCard}>
            <View style={styles.fieldBlock}>
              <AppText variant="overline" muted>
                EMAIL
              </AppText>
              <TextInput
                placeholder="you@example.com"
                value={pendingEmail ?? email}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading && !pendingEmail}
                onChangeText={setEmail}
                placeholderTextColor={colors.textMuted}
                style={[styles.input, pendingEmail ? styles.inputLocked : undefined]}
              />
            </View>

            {pendingEmail ? (
              <>
                <View style={styles.codeHeader}>
                  <View style={styles.codeHeaderText}>
                    <AppText variant="bodyStrong">Enter your code</AppText>
                    <AppText variant="caption" muted>
                      Supabase email OTP can be configured between 6 and 10 digits, so enter the full numeric code you received.
                    </AppText>
                  </View>
                  <Pressable
                    onPress={() => {
                      onResetEmailFlow();
                      setOtp("");
                    }}
                  >
                    <AppText variant="caption" style={styles.linkText}>
                      Change email
                    </AppText>
                  </Pressable>
                </View>

                <TextInput
                  placeholder="Enter code"
                  value={otp}
                  keyboardType="number-pad"
                  editable={!loading}
                  maxLength={10}
                  onChangeText={(value) => setOtp(value.replace(/[^\d]/g, ""))}
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, styles.otpInput]}
                />

                <AppButton
                  label={loading ? "Verifying..." : "Verify and continue"}
                  leftSlot={<MaterialIcons name="shield" size={18} color={colors.surface} />}
                  disabled={loading}
                  onPress={() => void handleVerifyCode()}
                />

                <AppButton
                  label={loading ? "Please wait..." : "Send a new code"}
                  variant="ghost"
                  disabled={loading}
                  onPress={() => void onSendEmailOtp(activeEmail)}
                />
              </>
            ) : (
              <AppButton
                label={loading ? "Sending..." : "Email me a code"}
                leftSlot={<MaterialIcons name="mail-outline" size={20} color={colors.surface} />}
                disabled={loading}
                onPress={() => void handleSendCode()}
              />
            )}
          </AppCard>

          {__DEV__ ? (
            <AppButton
              label="Skip login (DEV)"
              variant="ghost"
              disabled={loading}
              onPress={() => setDevSkipLogin(true)}
            />
          ) : null}

          {formError ? <AppText style={styles.error}>{formError}</AppText> : null}
          {message ? <AppText style={styles.success}>{message}</AppText> : null}
          {error ? <AppText style={styles.error}>{error}</AppText> : null}
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      justifyContent: "center",
      flexGrow: 1
    },
    header: {
      gap: spacing.sm,
      marginBottom: spacing.xxl
    },
    form: {
      gap: spacing.md
    },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border
    },
    emailCard: {
      gap: spacing.md
    },
    fieldBlock: {
      gap: spacing.xs
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      minHeight: 52,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.surface,
      color: colors.textPrimary
    },
    inputLocked: {
      backgroundColor: colors.surfaceMuted
    },
    otpInput: {
      letterSpacing: 4,
      fontSize: 18
    },
    codeHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: spacing.md
    },
    codeHeaderText: {
      flex: 1,
      gap: spacing.xs
    },
    linkText: {
      color: colors.primarySoft
    },
    success: {
      color: colors.success
    },
    error: {
      color: colors.error
    }
  });
