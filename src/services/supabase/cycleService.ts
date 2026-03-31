import NetInfo from "@react-native-community/netinfo";

import type { CycleSettings, CycleSettingsState } from "@/api/types";
import { getCurrentUserId } from "@/services/supabase/authHelpers";
import { asyncStorageService } from "@/services/storage/asyncStorage";
import { supabase } from "@/services/supabase/client";
import { storageKeys } from "@/utils/constants";
import { nowIso } from "@/utils/date";
import { AppError } from "@/utils/errors";

export type SaveCycleSettingsInput = {
  last_period_date: string;
  cycle_length_days: number;
  period_length_days: number;
  historical_last_period_date?: string | null;
  historical_cycle_length_days?: number | null;
  historical_period_length_days?: number | null;
  future_phase_start_date?: string | null;
};

function createEmptyState(): CycleSettingsState {
  return {
    settings: null,
    syncStatus: "synced",
    lastSyncedAt: null
  };
}

function getCycleSettingsStorageKey(userId: string): string {
  return `${storageKeys.cycleSettingsCachePrefix}.${userId}`;
}

async function readLocalCycleSettingsState(userId: string): Promise<CycleSettingsState | null> {
  return asyncStorageService.get<CycleSettingsState>(getCycleSettingsStorageKey(userId));
}

async function writeLocalCycleSettingsState(userId: string, state: CycleSettingsState): Promise<void> {
  await asyncStorageService.set(getCycleSettingsStorageKey(userId), state);
}

async function hasConnectivity(): Promise<boolean> {
  const netState = await NetInfo.fetch();
  return Boolean(netState.isConnected) && netState.isInternetReachable !== false;
}

async function fetchRemoteCycleSettings(): Promise<CycleSettings | null> {
  const { data, error } = await supabase.from("cycle_settings").select("*").maybeSingle<CycleSettings>();

  if (error) {
    throw new AppError("cycle_fetch_error", error.message);
  }

  return data;
}

async function upsertRemoteCycleSettings(userId: string, input: SaveCycleSettingsInput): Promise<CycleSettings> {
  const { data, error } = await supabase
    .from("cycle_settings")
    .upsert(
      {
        user_id: userId,
        ...input
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single<CycleSettings>();

  if (error) {
    throw new AppError("cycle_save_error", error.message);
  }

  return data;
}

function buildSyncedState(settings: CycleSettings | null, syncedAt = nowIso()): CycleSettingsState {
  return {
    settings,
    syncStatus: "synced",
    lastSyncedAt: settings ? syncedAt : null
  };
}

function isRemoteNewer(local: CycleSettingsState | null, remote: CycleSettings): boolean {
  const localUpdatedAt = local?.settings?.updated_at;

  if (!localUpdatedAt) {
    return true;
  }

  return new Date(remote.updated_at).getTime() >= new Date(localUpdatedAt).getTime();
}

export async function getCycleSettingsState(): Promise<CycleSettingsState> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return createEmptyState();
  }

  const localState = await readLocalCycleSettingsState(userId);

  if (!(await hasConnectivity())) {
    return localState ?? createEmptyState();
  }

  if (localState?.settings && localState.syncStatus === "pending") {
    try {
      const remoteSettings = await upsertRemoteCycleSettings(userId, {
        last_period_date: localState.settings.last_period_date,
        cycle_length_days: localState.settings.cycle_length_days,
        period_length_days: localState.settings.period_length_days,
        historical_last_period_date: localState.settings.historical_last_period_date,
        historical_cycle_length_days: localState.settings.historical_cycle_length_days,
        historical_period_length_days: localState.settings.historical_period_length_days,
        future_phase_start_date: localState.settings.future_phase_start_date
      });
      const syncedState = buildSyncedState(remoteSettings);
      await writeLocalCycleSettingsState(userId, syncedState);
      return syncedState;
    } catch {
      return localState;
    }
  }

  try {
    const remoteSettings = await fetchRemoteCycleSettings();

    if (!remoteSettings) {
      return localState ?? createEmptyState();
    }

    if (!localState || isRemoteNewer(localState, remoteSettings)) {
      const syncedState = buildSyncedState(remoteSettings);
      await writeLocalCycleSettingsState(userId, syncedState);
      return syncedState;
    }

    return localState;
  } catch {
    return localState ?? createEmptyState();
  }
}

export async function getCycleSettings(): Promise<CycleSettings | null> {
  const state = await getCycleSettingsState();
  return state.settings;
}

export async function saveCycleSettings(input: SaveCycleSettingsInput): Promise<CycleSettingsState> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new AppError("cycle_save_missing_user", "No authenticated user was available for cycle settings.");
  }

  const localState = await readLocalCycleSettingsState(userId);
  const timestamp = nowIso();
  const pendingSettings: CycleSettings = {
    user_id: userId,
    last_period_date: input.last_period_date,
    cycle_length_days: input.cycle_length_days,
    period_length_days: input.period_length_days,
    historical_last_period_date: input.historical_last_period_date ?? null,
    historical_cycle_length_days: input.historical_cycle_length_days ?? null,
    historical_period_length_days: input.historical_period_length_days ?? null,
    future_phase_start_date: input.future_phase_start_date ?? null,
    created_at: localState?.settings?.created_at ?? timestamp,
    updated_at: timestamp
  };
  const pendingState: CycleSettingsState = {
    settings: pendingSettings,
    syncStatus: "pending",
    lastSyncedAt: localState?.lastSyncedAt ?? null
  };

  await writeLocalCycleSettingsState(userId, pendingState);

  if (!(await hasConnectivity())) {
    return pendingState;
  }

  try {
    const remoteSettings = await upsertRemoteCycleSettings(userId, input);
    const syncedState = buildSyncedState(remoteSettings);
    await writeLocalCycleSettingsState(userId, syncedState);
    return syncedState;
  } catch {
    return pendingState;
  }
}

export async function syncCycleSettings(): Promise<CycleSettingsState> {
  return getCycleSettingsState();
}
