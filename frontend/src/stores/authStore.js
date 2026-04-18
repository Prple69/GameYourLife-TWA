import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Phase 3: real JWT auth. accessToken/refreshToken come from /api/auth/*
 * endpoints. isAuthenticated mirrors !!accessToken.
 *
 * Lifecycle:
 *   Login / Register / Telegram-login -> setTokens(access, refresh)
 *   401 response -> api.js interceptor tries /api/auth/refresh -> setTokens
 *   Refresh failed -> clearTokens() -> redirect /login
 */
const useAuthStore = create(
  persist(
    (set) => ({
      _hasHydrated: false,
      setHasHydrated: (val) => set({ _hasHydrated: val }),

      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setTokens: (access, refresh) =>
        set({ accessToken: access, refreshToken: refresh, isAuthenticated: !!access }),

      clearTokens: () =>
        set({ accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export default useAuthStore;
