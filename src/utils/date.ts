import { format } from "date-fns";

export function toIsoDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function asDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}
