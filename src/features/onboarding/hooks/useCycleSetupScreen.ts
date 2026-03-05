import { useMutation, useQueryClient } from "@tanstack/react-query";

import { saveCycleSettings, type SaveCycleSettingsInput } from "@/services/supabase/cycleService";
import { trackEvent } from "@/services/telemetry/analytics";
import { parseUnknownError } from "@/utils/errors";

export function useCycleSetupScreen() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (payload: SaveCycleSettingsInput) => saveCycleSettings(payload),
    onSuccess: () => {
      trackEvent("cycle_settings_saved", { atIso: new Date().toISOString() });
      void queryClient.invalidateQueries({ queryKey: ["cycleSettings"] });
    }
  });

  return {
    saveSettings: mutation.mutateAsync,
    loading: mutation.isPending,
    error: mutation.error ? parseUnknownError(mutation.error).message : null
  };
}
