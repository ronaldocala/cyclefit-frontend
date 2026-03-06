import * as AppleAuthentication from "expo-apple-authentication";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import { resetRevenueCatUser } from "@/services/revenuecat/revenueCatService";
import { supabase } from "@/services/supabase/client";
import { isDemoModeEnabled } from "@/utils/demoMode";
import { AppError } from "@/utils/errors";

WebBrowser.maybeCompleteAuthSession();

type AuthCallbackParams = {
  access_token?: string;
  refresh_token?: string;
  code?: string;
  error?: string;
  error_description?: string;
};

function parseParams(serializedParams: string | undefined): Record<string, string> {
  if (!serializedParams) {
    return {};
  }

  return serializedParams.split("&").reduce<Record<string, string>>((accumulator, entry) => {
    const [rawKey, ...rawValue] = entry.split("=");
    if (!rawKey) {
      return accumulator;
    }

    const key = decodeURIComponent(rawKey.replace(/\+/g, " "));
    const value = decodeURIComponent(rawValue.join("=").replace(/\+/g, " "));
    accumulator[key] = value;
    return accumulator;
  }, {});
}

function parseAuthCallbackParams(url: string): AuthCallbackParams {
  const [baseWithQuery, hashPart] = url.split("#");
  const queryPart = baseWithQuery.includes("?") ? baseWithQuery.split("?")[1] : undefined;

  return {
    ...parseParams(queryPart),
    ...parseParams(hashPart)
  };
}

export async function sendMagicLink(email: string): Promise<void> {
  const redirectUrl = Linking.createURL("/auth/callback");
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectUrl,
      shouldCreateUser: true
    }
  });

  if (error) {
    throw new AppError("auth_magic_link_error", error.message);
  }
}

export async function signInWithApple(): Promise<void> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL]
  });

  if (!credential.identityToken) {
    throw new AppError("auth_apple_no_token", "Apple identity token was missing");
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken
  });

  if (error) {
    throw new AppError("auth_apple_error", error.message);
  }
}

export async function signInWithGoogle(): Promise<void> {
  const redirectUrl = Linking.createURL("/auth/callback");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true
    }
  });

  if (error) {
    throw new AppError("auth_google_error", error.message);
  }

  if (!data?.url) {
    throw new AppError("auth_google_missing_url", "Google sign-in URL was missing");
  }

  const authResult = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
  if (authResult.type !== "success") {
    throw new AppError("auth_google_cancelled", "Google sign-in was cancelled");
  }

  const callbackParams = parseAuthCallbackParams(authResult.url);
  if (callbackParams.error) {
    throw new AppError("auth_google_callback_error", callbackParams.error_description ?? callbackParams.error);
  }

  if (callbackParams.access_token && callbackParams.refresh_token) {
    const { error: setSessionError } = await supabase.auth.setSession({
      access_token: callbackParams.access_token,
      refresh_token: callbackParams.refresh_token
    });
    if (setSessionError) {
      throw new AppError("auth_google_session_error", setSessionError.message);
    }
    return;
  }

  if (callbackParams.code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(callbackParams.code);
    if (exchangeError) {
      throw new AppError("auth_google_exchange_error", exchangeError.message);
    }
    return;
  }

  throw new AppError("auth_google_missing_tokens", "Google sign-in did not return a usable session");
}

export async function signOut(): Promise<void> {
  if (isDemoModeEnabled()) {
    return;
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new AppError("auth_signout_error", error.message);
  }

  await resetRevenueCatUser();
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new AppError("auth_session_error", error.message);
  }

  return data.session;
}
