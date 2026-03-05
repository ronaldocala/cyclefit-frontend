import { createClient } from "@supabase/supabase-js";

import { secureStoreService } from "@/services/storage/secureStorage";
import { env } from "@/utils/env";

const secureStorageAdapter = {
  getItem: secureStoreService.getItem,
  setItem: secureStoreService.setItem,
  removeItem: secureStoreService.removeItem
};

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: secureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});
