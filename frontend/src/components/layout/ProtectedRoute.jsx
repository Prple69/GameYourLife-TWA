import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

/**
 * Wraps /app/* routes. Redirects to /login?returnTo= if not authenticated.
 * Phase 2: isAuthenticated is always true (mock). Phase 3 enforces real auth.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return children;
}
