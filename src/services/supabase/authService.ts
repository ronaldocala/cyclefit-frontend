import * as AppleAuthentication from "expo-apple-authentication";
import * as Linking from "expo-linking";

import { supabase } from "@/services/supabase/client";
import { AppError } from "@/utils/errors";

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
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL
    ]
  });

  if (!credential.identityToken) {
    throw new AppError("auth_apple_no_token", "Apple identity token was missing");
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken});

  if (error) {
    throw new AppError("auth_apple_error", error.message);
  }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new AppError("auth_signout_error", error.message);
  }
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new AppError("auth_session_error", error.message);
  }

  return data.session;
}

