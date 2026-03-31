import { format, isValid } from "date-fns";

export function toIsoDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function asDate(value: string): Date {
  const parsed = new Date(`${value}T00:00:00`);

  return isValid(parsed) ? parsed : new Date();
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return isValid(parsed) && toIsoDate(parsed) === value;
}

export function formatEuropeanDate(value: string): string {
  if (!isValidIsoDate(value)) {
    return value;
  }

  return format(new Date(`${value}T00:00:00`), "dd.MM.yyyy");
}
