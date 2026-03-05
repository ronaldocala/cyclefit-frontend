import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppText } from "@/components/AppText";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useAuthScreen } from "@/features/auth/hooks/useAuthScreen";
import { colors, radius, spacing } from "@/theme/tokens";

const schema = z.object({
  email: z.string().email("Enter a valid email")
});

type FormValues = z.infer<typeof schema>;

export function SignInScreen() {
  const { onSendMagicLink, onSignInWithApple, loading, message, error } = useAuthScreen();

  const { handleSubmit, register, setValue, watch, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: ""
    }
  });

  register("email");

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <AppText variant="h2">Sign in</AppText>
          <AppText variant="body" muted>
            Use Apple or email magic link.
          </AppText>
        </View>

        <View style={styles.form}>
          <TextInput
            placeholder="Email"
            value={watch("email")}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={(value) => setValue("email", value, { shouldValidate: true })}
            style={styles.input}
          />
          {formState.errors.email?.message ? <AppText style={styles.error}>{formState.errors.email.message}</AppText> : null}

          <AppButton label={loading ? "Sending..." : "Send magic link"} onPress={handleSubmit((values) => onSendMagicLink(values.email))} />
          <AppButton label={loading ? "Please wait..." : "Continue with Apple"} variant="outline" onPress={onSignInWithApple} />

          {message ? <AppText style={styles.success}>{message}</AppText> : null}
          {error ? <AppText style={styles.error}>{error}</AppText> : null}
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface
  },
  success: {
    color: colors.success
  },
  error: {
    color: colors.error
  }
});
