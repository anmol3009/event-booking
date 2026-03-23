import { Navigate } from 'react-router-dom';

// We use Google Sign-In only — no email/password signup needed.
// Redirect anyone who visits /auth/signup to the login page.
export default function Signup() {
  return <Navigate to="/auth/login" replace />;
}
