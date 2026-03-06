import Constants from "expo-constants";

type ExtraConfig = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  revenueCatAppleApiKey?: string;
  revenueCatGoogleApiKey?: string;
  sentryDsn?: string;
  demoMode?: string | boolean;
};

type RequiredStringKey = "supabaseUrl" | "supabaseAnonKey";

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;

function readRequiredEnv(key: RequiredStringKey): string {
  const value = extra[key];
  if (!value) {
    throw new Error(`Missing required runtime config: ${key}`);
  }
  return value;
}

function readBooleanEnv(value: string | boolean | undefined): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export const env = {
  supabaseUrl: readRequiredEnv("supabaseUrl"),
  supabaseAnonKey: readRequiredEnv("supabaseAnonKey"),
  revenueCatAppleApiKey: extra.revenueCatAppleApiKey ?? "",
  revenueCatGoogleApiKey: extra.revenueCatGoogleApiKey ?? "",
  sentryDsn: extra.sentryDsn ?? "",
  demoMode: readBooleanEnv(extra.demoMode)
};
