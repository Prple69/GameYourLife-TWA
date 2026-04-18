import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Phase 2: set mock token on first visit so ProtectedRoute lets users through.
// Phase 3 will replace this with real JWT obtained from /api/auth/login.
const DEV_MOCK_TOKEN = import.meta.env.VITE_DEV_TOKEN ?? 'dev-phase2-mock';

const useAuthStore = create(
  persist(
    (set) => ({
      _hasHydrated: false,
      setHasHydrated: (val) => set({ _hasHydrated: val }),

      accessToken: DEV_MOCK_TOKEN,   // Phase 2: mock token pre-populated
      refreshToken: null,
      isAuthenticated: true,          // Phase 2: always true; Phase 3 sets from login

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
