import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";

type AuthState = {
  session: Session | null;
  loading: boolean;
  devSkipLogin: boolean;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setDevSkipLogin: (enabled: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  loading: true,
  devSkipLogin: false,
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setDevSkipLogin: (enabled) => set({ devSkipLogin: enabled, loading: false })
}));
