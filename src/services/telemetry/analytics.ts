import { logger } from "@/services/telemetry/logger";

export type AnalyticsEvent =
  | "signup_complete"
  | "cycle_settings_saved"
  | "recommendation_viewed"
  | "workout_started"
  | "workout_completed"
  | "paywall_viewed"
  | "purchase_attempted"
  | "purchase_result"
  | "restore_purchases_result";

export function trackEvent(event: AnalyticsEvent, properties?: Record<string, unknown>): void {
  logger.info(`analytics:${event}`, {
    properties,
    eventLoggedAt: new Date().toISOString()
  });
}
