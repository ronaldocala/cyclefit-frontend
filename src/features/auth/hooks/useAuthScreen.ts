import { useCallback, useState } from "react";

import { sendEmailOtp, signInWithApple, signInWithGoogle, verifyEmailOtp } from "@/services/supabase/authService";
import { trackEvent } from "@/services/telemetry/analytics";
import { parseUnknownError } from "@/utils/errors";

export function useAuthScreen() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const onSendEmailOtp = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const result = await sendEmailOtp(normalizedEmail);
      setPendingEmail(normalizedEmail);
      setMessage(
        result.mode === "review"
          ? `Review login enabled for ${normalizedEmail}. Enter the 4-digit review code.`
          : `Code sent to ${normalizedEmail}.`
      );
      trackEvent("signup_started", {
        method: result.mode === "review" ? "review_code" : "email_otp",
        atIso: new Date().toISOString()
      });
    } catch (unknownError) {
      const parsed = parseUnknownError(unknownError, "auth_email_otp_failed");
      setError(parsed.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const onVerifyEmailOtp = useCallback(async (email: string, token: string) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await verifyEmailOtp(email, token);
      trackEvent("signup_complete", {
        method: "email_otp",
        atIso: new Date().toISOString()
      });
    } catch (unknownError) {
      const parsed = parseUnknownError(unknownError, "auth_email_verify_failed");
      setError(parsed.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const onResetEmailFlow = useCallback(() => {
    setPendingEmail(null);
    setMessage(null);
    setError(null);
  }, []);

  const onSignInWithApple = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await signInWithApple();
      trackEvent("signup_complete", {
        method: "apple",
        atIso: new Date().toISOString()
      });
    } catch (unknownError) {
      const parsed = parseUnknownError(unknownError, "auth_apple_failed");
      setError(parsed.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const onSignInWithGoogle = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await signInWithGoogle();
      trackEvent("signup_complete", {
        method: "google",
        atIso: new Date().toISOString()
      });
    } catch (unknownError) {
      const parsed = parseUnknownError(unknownError, "auth_google_failed");
      setError(parsed.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    message,
    error,
    pendingEmail,
    onSendEmailOtp,
    onVerifyEmailOtp,
    onResetEmailFlow,
    onSignInWithApple,
    onSignInWithGoogle
  };
}
