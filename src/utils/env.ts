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
type ProcessEnvKey =
  | "EXPO_PUBLIC_SUPABASE_URL"
  | "EXPO_PUBLIC_SUPABASE_ANON_KEY"
  | "EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY"
  | "EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY"
  | "EXPO_PUBLIC_SENTRY_DSN"
  | "EXPO_PUBLIC_DEMO_MODE";

type ConstantsWithEmbeddedConfig = typeof Constants & {
  manifest?: { extra?: ExtraConfig } | null;
  manifest2?: { extra?: ExtraConfig } | null;
};

const constantsWithEmbeddedConfig = Constants as ConstantsWithEmbeddedConfig;
const embeddedExtra = {
  ...(constantsWithEmbeddedConfig.expoConfig?.extra ?? {}),
  ...(constantsWithEmbeddedConfig.manifest?.extra ?? {}),
  ...(constantsWithEmbeddedConfig.manifest2?.extra ?? {})
} as ExtraConfig;

function readProcessEnv(key: ProcessEnvKey): string | undefined {
  if (typeof process === "undefined" || !process.env) {
    return undefined;
  }

  const value = process.env[key];
  return typeof value === "string" ? value : undefined;
}

function readOptionalString(key: keyof ExtraConfig, processEnvKey: ProcessEnvKey): string {
  const embeddedValue = embeddedExtra[key];
  if (typeof embeddedValue === "string" && embeddedValue.trim().length > 0) {
    return embeddedValue;
  }

  const processValue = readProcessEnv(processEnvKey);
  if (typeof processValue === "string" && processValue.trim().length > 0) {
    return processValue;
  }

  return "";
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

function readRequiredEnv(key: RequiredStringKey): string {
  const processEnvKey =
    key === "supabaseUrl" ? "EXPO_PUBLIC_SUPABASE_URL" : "EXPO_PUBLIC_SUPABASE_ANON_KEY";

  return readOptionalString(key, processEnvKey);
}

export const env = {
  supabaseUrl: readRequiredEnv("supabaseUrl"),
  supabaseAnonKey: readRequiredEnv("supabaseAnonKey"),
  revenueCatAppleApiKey: readOptionalString("revenueCatAppleApiKey", "EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY"),
  revenueCatGoogleApiKey: readOptionalString("revenueCatGoogleApiKey", "EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY"),
  sentryDsn: readOptionalString("sentryDsn", "EXPO_PUBLIC_SENTRY_DSN"),
  demoMode: readBooleanEnv(embeddedExtra.demoMode ?? readProcessEnv("EXPO_PUBLIC_DEMO_MODE"))
};

export const missingRuntimeConfigKeys: RequiredStringKey[] = (["supabaseUrl", "supabaseAnonKey"] as const).filter(
  (key) => !env[key]
);

export const hasRequiredRuntimeConfig = missingRuntimeConfigKeys.length === 0;
