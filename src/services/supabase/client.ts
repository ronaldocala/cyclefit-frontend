import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { Platform } from "react-native";

import { secureStoreService } from "@/services/storage/secureStorage";
import { env } from "@/utils/env";

function readExpoDevHost(): string | null {
  const maybeConfig = Constants.expoConfig as { hostUri?: string } | null;
  const hostUri = maybeConfig?.hostUri;
  if (!hostUri || typeof hostUri !== "string") {
    return null;
  }

  const [host] = hostUri.split(":");
  return host || null;
}

function isLoopbackHost(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host === "::1";
}

function replaceLoopbackHost(urlValue: string, targetHost: string): string {
  return urlValue
    .replace("http://127.0.0.1", `http://${targetHost}`)
    .replace("http://localhost", `http://${targetHost}`)
    .replace("https://127.0.0.1", `https://${targetHost}`)
    .replace("https://localhost", `https://${targetHost}`);
}

function isLoopbackUrl(urlValue: string): boolean {
  return (
    urlValue.includes("://127.0.0.1") ||
    urlValue.includes("://localhost") ||
    urlValue.includes("://[::1]") ||
    urlValue.includes("://0.0.0.0")
  );
}

function resolveSupabaseUrl(urlValue: string): string {
  if (!isLoopbackUrl(urlValue)) {
    return urlValue;
  }

  const expoHost = readExpoDevHost();
  if (expoHost && !isLoopbackHost(expoHost)) {
    // Physical devices should use the machine host reported by Expo dev server.
    return replaceLoopbackHost(urlValue, expoHost);
  }

  if (Platform.OS === "android") {
    // Android emulators access the host machine through 10.0.2.2.
    return replaceLoopbackHost(urlValue, "10.0.2.2");
  }

  if (expoHost) {
    // iOS physical devices cannot reach localhost on your laptop.
    return replaceLoopbackHost(urlValue, expoHost);
  }

  return urlValue;
}

const secureStorageAdapter = {
  getItem: secureStoreService.getItem,
  setItem: secureStoreService.setItem,
  removeItem: secureStoreService.removeItem
};

const fallbackSupabaseUrl = "https://placeholder.invalid";
const fallbackSupabaseAnonKey = "missing-supabase-anon-key";

export const supabase = createClient(resolveSupabaseUrl(env.supabaseUrl || fallbackSupabaseUrl), env.supabaseAnonKey || fallbackSupabaseAnonKey, {
  auth: {
    storage: secureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});
