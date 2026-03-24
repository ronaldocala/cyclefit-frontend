import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";

type AuthState = {
  session: Session | null;
  loading: boolean;
  devSkipLogin: boolean;
  bootstrapError: string | null;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setDevSkipLogin: (enabled: boolean) => void;
  setBootstrapError: (message: string | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  loading: true,
  devSkipLogin: false,
  bootstrapError: null,
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setDevSkipLogin: (enabled) => set({ devSkipLogin: enabled, loading: false }),
  setBootstrapError: (bootstrapError) => set({ bootstrapError })
}));
