import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// These values come from Firebase Console → Project Settings → General → Your Apps → Web App
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app      = initializeApp(firebaseConfig);
export const auth     = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
