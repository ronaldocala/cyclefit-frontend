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
    bundleIdentifier: "com.cyclefit",
    usesAppleSignIn: true,
    config: {
      usesNonExemptEncryption: false
    }
  },
  android: {
    package: "com.cyclefit"
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    demoMode: process.env.EXPO_PUBLIC_DEMO_MODE,
    eas: {
      projectId: "a59eafb9-df9a-4769-9f6c-5d7cc1824398"
    }
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
