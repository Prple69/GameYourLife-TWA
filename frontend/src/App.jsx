import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import useAuthStore from './stores/authStore';
import LoadingPage from './pages/LoadingPage';
import LandingPage from './pages/landing/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import NotFoundPage from './pages/NotFoundPage';
import PrivacyPage from './pages/legal/PrivacyPage';
import TermsPage from './pages/legal/TermsPage';
import OfferPage from './pages/legal/OfferPage';

// /app/* pages: lazy-loaded so they only download when user navigates there
const CharacterPage   = lazy(() => import('./pages/CharacterPage'));
const QuestsPage      = lazy(() => import('./pages/QuestsPage'));
const ShopPage        = lazy(() => import('./pages/ShopPage'));
const InventoryPage   = lazy(() => import('./pages/InventoryPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const FriendsPage     = lazy(() => import('./pages/FriendsPage'));
const GuildsPage      = lazy(() => import('./pages/GuildsPage'));

const AppSuspense = ({ children }) => (
  <Suspense fallback={<LoadingPage progress={80} isLoaded={false} />}>
    {children}
  </Suspense>
);

export default function App() {
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  if (!hasHydrated) {
    return <LoadingPage progress={0} isLoaded={false} />;
  }

  return (
    <Routes>
      {/* ── Public: Landing ── */}
      <Route path="/" element={<LandingPage />} />

      {/* ── Auth ── */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      <Route path="/reset-password"      element={<LoginPage />} />

      {/* ── Legal ── */}
      <Route path="/privacy"      element={<PrivacyPage />} />
      <Route path="/terms"        element={<TermsPage />} />
      <Route path="/public-offer" element={<OfferPage />} />

      {/* ── Protected app ── */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="quests" replace />} />
        <Route path="quests"      element={<AppSuspense><QuestsPage /></AppSuspense>} />
        <Route path="character"   element={<AppSuspense><CharacterPage /></AppSuspense>} />
        <Route path="shop"        element={<AppSuspense><ShopPage /></AppSuspense>} />
        <Route path="inventory"   element={<AppSuspense><InventoryPage /></AppSuspense>} />
        <Route path="leaderboard" element={<AppSuspense><LeaderboardPage /></AppSuspense>} />
        <Route path="friends"     element={<AppSuspense><FriendsPage /></AppSuspense>} />
        <Route path="guilds"      element={<AppSuspense><GuildsPage /></AppSuspense>} />
        <Route path="settings"    element={<NotFoundPage />} />
      </Route>

      {/* ── 404 ── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
