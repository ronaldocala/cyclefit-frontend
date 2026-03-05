import type { CycleSettings } from "@/api/types";
import { supabase } from "@/services/supabase/client";
import { AppError } from "@/utils/errors";

export type SaveCycleSettingsInput = {
  last_period_date: string;
  cycle_length_days: number;
  period_length_days: number;
};

export async function getCycleSettings(): Promise<CycleSettings | null> {
  const { data, error } = await supabase.from("cycle_settings").select("*").maybeSingle<CycleSettings>();

  if (error) {
    throw new AppError("cycle_fetch_error", error.message);
  }

  return data;
}

export async function saveCycleSettings(input: SaveCycleSettingsInput): Promise<CycleSettings> {
  const { data, error } = await supabase
    .from("cycle_settings")
    .update(input)
    .select("*")
    .single<CycleSettings>();

  if (error) {
    throw new AppError("cycle_save_error", error.message);
  }

  return data;
}
