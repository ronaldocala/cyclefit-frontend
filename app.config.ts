import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "CycleFit+",
  slug: "cyclefit-plus",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "cyclefit",
  userInterfaceStyle: "light",
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.cyclefit.app"
  },
  android: {
    package: "com.cyclefit.app"
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    revenueCatAppleApiKey: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY,
    revenueCatGoogleApiKey: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY,
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    demoMode: process.env.EXPO_PUBLIC_DEMO_MODE
  },
  plugins: [
    "expo-font",
    "expo-secure-store",
    "expo-apple-authentication",
    "expo-web-browser",
    [
      "@sentry/react-native/expo",
      {
        url: "https://sentry.io/"
      }
    ]
  ]
};

export default config;
