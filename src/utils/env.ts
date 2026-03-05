import Constants from "expo-constants";

type ExtraConfig = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  revenueCatAppleApiKey?: string;
  revenueCatGoogleApiKey?: string;
  sentryDsn?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;

function readRequiredEnv(key: keyof ExtraConfig): string {
  const value = extra[key];
  if (!value) {
    throw new Error(`Missing required runtime config: ${key}`);
  }
  return value;
}

export const env = {
  supabaseUrl: readRequiredEnv("supabaseUrl"),
  supabaseAnonKey: readRequiredEnv("supabaseAnonKey"),
  revenueCatAppleApiKey: extra.revenueCatAppleApiKey ?? "",
  revenueCatGoogleApiKey: extra.revenueCatGoogleApiKey ?? "",
  sentryDsn: extra.sentryDsn ?? ""
};
