import { useCallback, useState } from "react";

import { sendMagicLink, signInWithApple } from "@/services/supabase/authService";
import { trackEvent } from "@/services/telemetry/analytics";
import { parseUnknownError } from "@/utils/errors";

export function useAuthScreen() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSendMagicLink = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await sendMagicLink(email);
      setMessage(`Magic link sent to ${email}. Check inbox and spam.`);
      trackEvent("signup_complete", {
        method: "email_magic_link",
        atIso: new Date().toISOString()
      });
    } catch (unknownError) {
      const parsed = parseUnknownError(unknownError, "auth_magic_link_failed");
      setError(parsed.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const onSignInWithApple = useCallback(async () => {
    setLoading(true);
    setError(null);

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

  return {
    loading,
    message,
    error,
    onSendMagicLink,
    onSignInWithApple
  };
}
