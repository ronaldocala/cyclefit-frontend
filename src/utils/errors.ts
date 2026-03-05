export class AppError extends Error {
  public readonly code: string;
  public readonly timestampIso: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.timestampIso = new Date().toISOString();
  }
}

export function parseUnknownError(error: unknown, fallbackCode = "unknown_error"): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(fallbackCode, error.message);
  }

  return new AppError(fallbackCode, "Unexpected error");
}
