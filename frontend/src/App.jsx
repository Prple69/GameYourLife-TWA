import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute';
import useAuthStore from './stores/authStore';
import LoadingPage from './pages/LoadingPage';

// Lazy-loaded /app/* pages — chunks downloaded on demand
const CharacterPage   = lazy(() => import('./pages/CharacterPage'));
const QuestsPage      = lazy(() => import('./pages/QuestsPage'));
const ShopPage        = lazy(() => import('./pages/ShopPage'));
const InventoryPage   = lazy(() => import('./pages/InventoryPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));

// Eagerly-imported pages (small; needed immediately or very early)
// These are added in Plan 02-02 (legal) and 02-03 (landing, layout).
// Placeholders inserted here so router compiles — Plan 02-03 replaces them.
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  // Wait for Zustand to rehydrate from localStorage before rendering routes.
  // Prevents /app redirect flicker on page reload with valid token.
  if (!hasHydrated) {
    return <LoadingPage progress={0} isLoaded={false} />;
  }

  return (
    <Routes>
      {/* ── Public routes (added by Plan 02-03) ── */}
      {/* Placeholder: Plan 02-03 will replace this Navigate with <LandingPage /> */}
      <Route path="/" element={<Navigate to="/app/quests" replace />} />

      {/* ── Auth shell pages (Phase 3 will implement; Phase 2 = placeholder) ── */}
      <Route path="/login"           element={<NotFoundPage />} />
      <Route path="/register"        element={<NotFoundPage />} />
      <Route path="/verify-email/:token" element={<NotFoundPage />} />
      <Route path="/reset-password"  element={<NotFoundPage />} />

      {/* ── Legal pages (added by Plan 02-02) ── */}
      {/* Placeholders; Plan 02-02 will replace NotFoundPage with real components */}
      <Route path="/privacy"      element={<NotFoundPage />} />
      <Route path="/terms"        element={<NotFoundPage />} />
      <Route path="/public-offer" element={<NotFoundPage />} />

      {/* ── Protected app area ── */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            {/* Plan 02-03 replaces this div+Suspense with <AppLayout /> */}
            <div className="min-h-screen bg-black text-white font-mono">
              <Suspense fallback={<LoadingPage progress={50} isLoaded={false} />}>
                <Routes>
                  <Route path="character"  element={<CharacterPage />} />
                  <Route path="quests"     element={<QuestsPage />} />
                  <Route path="shop"       element={<ShopPage />} />
                  <Route path="inventory"  element={<InventoryPage />} />
                  <Route path="leaderboard" element={<LeaderboardPage />} />
                  <Route index element={<Navigate to="quests" replace />} />
                </Routes>
              </Suspense>
            </div>
          </ProtectedRoute>
        }
      />

      {/* ── 404 fallback ── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
