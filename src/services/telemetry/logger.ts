import { Platform } from "react-native";

import { nowIso } from "@/utils/date";

function formatLine(level: "debug" | "info" | "warn" | "error", message: string, context?: unknown): string {
  return `[${nowIso()}] [${Platform.OS}] [${level.toUpperCase()}] ${message}${context ? ` ${JSON.stringify(context)}` : ""}`;
}

export const logger = {
  debug(message: string, context?: unknown): void {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(formatLine("debug", message, context));
    }
  },

  info(message: string, context?: unknown): void {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.info(formatLine("info", message, context));
    }
  },

  warn(message: string, context?: unknown): void {
    // eslint-disable-next-line no-console
    console.warn(formatLine("warn", message, context));
  },

  error(message: string, context?: unknown): void {
    // eslint-disable-next-line no-console
    console.error(formatLine("error", message, context));
  }
};
