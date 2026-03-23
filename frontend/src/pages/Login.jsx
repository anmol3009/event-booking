import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import useStore from '../store/useStore';
import useTheme from '../store/useTheme';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useStore();
  const { mode }  = useTheme();
  const isDark    = mode === 'dark';
  const [loading, setLoading] = useState(false);

  // After login, go back to the page the user was trying to visit (or home)
  const from = location.state?.from?.pathname || '/';

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // 1. Sign in with Google popup via Firebase
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      // 2. Get the Firebase ID token (used to call our backend)
      const idToken = await firebaseUser.getIdToken();

      // 3. Call our backend to upsert the user in Firestore
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Backend login failed');
      }

      const data = await res.json();

      // 4. Store user + token in Zustand (token is used for all future API calls)
      login({ ...data.user, token: idToken });

      toast.success(`Welcome, ${data.user.name || firebaseUser.displayName}! 🎉`);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('[Login] error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        toast('Sign-in cancelled.', { icon: 'ℹ️' });
      } else {
        toast.error(err.message || 'Sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Flame className="w-10 h-10 mx-auto mb-3" style={{ color: '#7DA8CF' }} />
          <h1 className="text-2xl font-bold font-heading" style={{ color: isDark ? '#fff' : '#111' }}>Welcome to CookMyShow</h1>
          <p className="text-sm mt-1" style={{ color: isDark ? '#666' : '#999' }}>Sign in to book tickets, manage bookings, and more</p>
        </div>

        <div className="rounded-lg border p-8" style={{ borderColor: isDark ? '#1a1a1a' : '#eee', background: isDark ? '#0a0a0a' : '#fafafa' }}>

          {/* Google Sign-In — the only auth method */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full rounded border py-3 text-sm cursor-pointer flex items-center justify-center gap-3 transition-all font-semibold"
            style={{
              background: loading ? (isDark ? '#111' : '#f5f5f5') : 'transparent',
              borderColor: isDark ? '#333' : '#ddd',
              color: isDark ? '#fff' : '#333',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-transparent rounded-full inline-block"
                style={{ borderTopColor: '#7DA8CF' }}
              />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? 'Signing in…' : 'Continue with Google'}
          </button>

          <div className="mt-6 text-center">
            <p className="text-xs" style={{ color: isDark ? '#444' : '#bbb' }}>
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm" style={{ color: isDark ? '#555' : '#aaa' }}>
              Don&apos;t have an account?{' '}
              <span style={{ color: '#7DA8CF' }}>Google creates it automatically on first sign-in.</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
