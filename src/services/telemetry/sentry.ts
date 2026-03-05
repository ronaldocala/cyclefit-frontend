import * as Sentry from "@sentry/react-native";

import { env } from "@/utils/env";

export function initSentry(): void {
  if (!env.sentryDsn) {
    return;
  }

  Sentry.init({
    dsn: env.sentryDsn,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    enabled: !__DEV__
  });
}

export function captureException(error: unknown): void {
  Sentry.captureException(error);
}
