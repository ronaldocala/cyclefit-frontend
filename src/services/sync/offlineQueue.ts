import NetInfo from "@react-native-community/netinfo";

import { createCompletedSession, type SaveSessionInput } from "@/services/supabase/sessionsService";
import { asyncStorageService } from "@/services/storage/asyncStorage";
import { logger } from "@/services/telemetry/logger";
import { storageKeys } from "@/utils/constants";
import { isDemoModeEnabled } from "@/utils/demoMode";

type SessionQueueItem = {
  id: string;
  type: "create_completed_session";
  payload: SaveSessionInput;
  queuedAtIso: string;
};

async function readQueue(): Promise<SessionQueueItem[]> {
  return (await asyncStorageService.get<SessionQueueItem[]>(storageKeys.offlineQueue)) ?? [];
}

async function writeQueue(items: SessionQueueItem[]): Promise<void> {
  await asyncStorageService.set(storageKeys.offlineQueue, items);
}

export async function enqueueCompletedSession(payload: SaveSessionInput): Promise<void> {
  const queue = await readQueue();
  queue.push({
    id: `queue-${Date.now()}`,
    type: "create_completed_session",
    payload,
    queuedAtIso: new Date().toISOString()
  });
  await writeQueue(queue);
}

export async function saveSessionOfflineFirst(payload: SaveSessionInput): Promise<"saved" | "queued"> {
  if (isDemoModeEnabled()) {
    return "saved";
  }

  const netState = await NetInfo.fetch();
  if (!netState.isConnected) {
    await enqueueCompletedSession(payload);
    return "queued";
  }

  try {
    await createCompletedSession(payload);
    return "saved";
  } catch {
    await enqueueCompletedSession(payload);
    return "queued";
  }
}

export async function syncOfflineQueue(): Promise<void> {
  if (isDemoModeEnabled()) {
    return;
  }

  const netState = await NetInfo.fetch();
  if (!netState.isConnected) {
    return;
  }

  const queue = await readQueue();
  if (!queue.length) {
    return;
  }

  const remaining: SessionQueueItem[] = [];

  for (const item of queue) {
    if (item.type !== "create_completed_session") {
      continue;
    }

    try {
      await createCompletedSession(item.payload);
      logger.info("Offline session synced", { queuedAtIso: item.queuedAtIso });
    } catch {
      remaining.push(item);
    }
  }

  await writeQueue(remaining);
}
