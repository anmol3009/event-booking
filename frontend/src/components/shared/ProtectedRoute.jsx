import { Navigate, useLocation } from 'react-router-dom';
import useStore from '../../store/useStore';

/**
 * ProtectedRoute
 * Wraps any route that requires authentication.
 * If the user is not logged in, redirects to /auth/login
 * and preserves the intended destination via `state.from`.
 */
export default function ProtectedRoute({ children }) {
  const { isLoggedIn } = useStore();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return children;
}
