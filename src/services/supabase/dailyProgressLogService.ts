import NetInfo from "@react-native-community/netinfo";

import type { DailyProgressLog, DailyProgressLogState } from "@/api/types";
import { asyncStorageService } from "@/services/storage/asyncStorage";
import { supabase } from "@/services/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { nowIso, toIsoDate } from "@/utils/date";
import { AppError } from "@/utils/errors";
import { storageKeys } from "@/utils/constants";

export type SaveDailyProgressLogInput = {
  logDate?: string;
  moodLevel?: number | null;
  energyLevel?: number | null;
};

type DailyProgressLogStateMap = Record<string, DailyProgressLogState>;

function createEmptyState(): DailyProgressLogState {
  return {
    entry: null,
    syncStatus: "synced",
    lastSyncedAt: null
  };
}

function getDailyProgressLogsStorageKey(userId: string): string {
  return `${storageKeys.dailyProgressLogsCachePrefix}.${userId}`;
}

async function getCurrentUserId(): Promise<string | null> {
  const storedSession = useAuthStore.getState().session;
  if (storedSession?.user.id) {
    return storedSession.user.id;
  }

  const {
    data: { session }
  } = await supabase.auth.getSession();

  return session?.user.id ?? null;
}

async function readLocalStateMap(userId: string): Promise<DailyProgressLogStateMap> {
  return (await asyncStorageService.get<DailyProgressLogStateMap>(getDailyProgressLogsStorageKey(userId))) ?? {};
}

async function writeLocalStateMap(userId: string, stateMap: DailyProgressLogStateMap): Promise<void> {
  await asyncStorageService.set(getDailyProgressLogsStorageKey(userId), stateMap);
}

async function readLocalState(userId: string, logDate: string): Promise<DailyProgressLogState | null> {
  const stateMap = await readLocalStateMap(userId);
  return stateMap[logDate] ?? null;
}

async function writeLocalState(userId: string, logDate: string, state: DailyProgressLogState): Promise<void> {
  const stateMap = await readLocalStateMap(userId);
  stateMap[logDate] = state;
  await writeLocalStateMap(userId, stateMap);
}

async function hasConnectivity(): Promise<boolean> {
  const netState = await NetInfo.fetch();
  return Boolean(netState.isConnected) && netState.isInternetReachable !== false;
}

async function fetchRemoteDailyProgressLog(logDate: string): Promise<DailyProgressLog | null> {
  const { data, error } = await supabase
    .from("daily_progress_logs")
    .select("*")
    .eq("log_date", logDate)
    .maybeSingle<DailyProgressLog>();

  if (error) {
    throw new AppError("daily_progress_fetch_error", error.message);
  }

  return data;
}

async function upsertRemoteDailyProgressLog(userId: string, entry: DailyProgressLog): Promise<DailyProgressLog> {
  const { data, error } = await supabase
    .from("daily_progress_logs")
    .upsert(
      {
        user_id: userId,
        log_date: entry.log_date,
        mood_level: entry.mood_level,
        energy_level: entry.energy_level
      },
      { onConflict: "user_id,log_date" }
    )
    .select("*")
    .single<DailyProgressLog>();

  if (error) {
    throw new AppError("daily_progress_save_error", error.message);
  }

  return data;
}

function buildSyncedState(entry: DailyProgressLog | null, syncedAt = nowIso()): DailyProgressLogState {
  return {
    entry,
    syncStatus: "synced",
    lastSyncedAt: entry ? syncedAt : null
  };
}

function isRemoteNewer(local: DailyProgressLogState | null, remote: DailyProgressLog): boolean {
  const localUpdatedAt = local?.entry?.updated_at;

  if (!localUpdatedAt) {
    return true;
  }

  return new Date(remote.updated_at).getTime() >= new Date(localUpdatedAt).getTime();
}

function normalizeLogDate(logDate?: string): string {
  return logDate ?? toIsoDate(new Date());
}

function buildPendingEntry(
  userId: string,
  input: SaveDailyProgressLogInput,
  existingEntry: DailyProgressLog | null,
  timestamp: string
): DailyProgressLog {
  return {
    user_id: userId,
    log_date: normalizeLogDate(input.logDate),
    mood_level: input.moodLevel !== undefined ? input.moodLevel : (existingEntry?.mood_level ?? null),
    energy_level: input.energyLevel !== undefined ? input.energyLevel : (existingEntry?.energy_level ?? null),
    created_at: existingEntry?.created_at ?? timestamp,
    updated_at: timestamp
  };
}

export async function getDailyProgressLogState(logDate?: string): Promise<DailyProgressLogState> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return createEmptyState();
  }

  const normalizedLogDate = normalizeLogDate(logDate);
  const localState = await readLocalState(userId, normalizedLogDate);

  if (!(await hasConnectivity())) {
    return localState ?? createEmptyState();
  }

  if (localState?.entry && localState.syncStatus === "pending") {
    try {
      const remoteEntry = await upsertRemoteDailyProgressLog(userId, localState.entry);
      const syncedState = buildSyncedState(remoteEntry);
      await writeLocalState(userId, normalizedLogDate, syncedState);
      return syncedState;
    } catch {
      return localState;
    }
  }

  try {
    const remoteEntry = await fetchRemoteDailyProgressLog(normalizedLogDate);

    if (!remoteEntry) {
      return localState ?? createEmptyState();
    }

    if (!localState || isRemoteNewer(localState, remoteEntry)) {
      const syncedState = buildSyncedState(remoteEntry);
      await writeLocalState(userId, normalizedLogDate, syncedState);
      return syncedState;
    }

    return localState;
  } catch {
    return localState ?? createEmptyState();
  }
}

export async function saveDailyProgressLog(input: SaveDailyProgressLogInput): Promise<DailyProgressLogState> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new AppError("daily_progress_missing_user", "No authenticated user was available for daily progress logging.");
  }

  const normalizedLogDate = normalizeLogDate(input.logDate);
  const localState = await readLocalState(userId, normalizedLogDate);
  const timestamp = nowIso();
  const pendingEntry = buildPendingEntry(
    userId,
    {
      ...input,
      logDate: normalizedLogDate
    },
    localState?.entry ?? null,
    timestamp
  );

  const pendingState: DailyProgressLogState = {
    entry: pendingEntry,
    syncStatus: "pending",
    lastSyncedAt: localState?.lastSyncedAt ?? null
  };

  await writeLocalState(userId, normalizedLogDate, pendingState);

  if (!(await hasConnectivity())) {
    return pendingState;
  }

  try {
    const remoteEntry = await upsertRemoteDailyProgressLog(userId, pendingEntry);
    const syncedState = buildSyncedState(remoteEntry);
    await writeLocalState(userId, normalizedLogDate, syncedState);
    return syncedState;
  } catch {
    return pendingState;
  }
}

export async function syncDailyProgressLogs(): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId || !(await hasConnectivity())) {
    return;
  }

  const stateMap = await readLocalStateMap(userId);
  const pendingEntries = Object.entries(stateMap).filter(([, state]) => state.syncStatus === "pending" && Boolean(state.entry));

  if (!pendingEntries.length) {
    return;
  }

  for (const [logDate, state] of pendingEntries) {
    if (!state.entry) {
      continue;
    }

    try {
      const remoteEntry = await upsertRemoteDailyProgressLog(userId, state.entry);
      stateMap[logDate] = buildSyncedState(remoteEntry);
    } catch {
      stateMap[logDate] = state;
    }
  }

  await writeLocalStateMap(userId, stateMap);
}
