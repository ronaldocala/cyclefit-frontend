export class AppError extends Error {
  public readonly code: string;
  public readonly timestampIso: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.timestampIso = new Date().toISOString();
  }
}

function normalizeErrorMessage(message: string): string {
  if (message.trim().toLowerCase() === "invalid api key") {
    return "CycleFit is using an invalid Supabase public API key. Update EXPO_PUBLIC_SUPABASE_ANON_KEY in the EAS production environment, then rebuild the TestFlight app.";
  }

  return message;
}

export function parseUnknownError(error: unknown, fallbackCode = "unknown_error"): AppError {
  if (error instanceof AppError) {
    return new AppError(error.code, normalizeErrorMessage(error.message));
  }

  if (error instanceof Error) {
    return new AppError(fallbackCode, normalizeErrorMessage(error.message));
  }

  return new AppError(fallbackCode, "Unexpected error");
}
