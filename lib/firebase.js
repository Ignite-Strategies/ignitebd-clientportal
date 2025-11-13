import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Only initialize Firebase on client side
let auth = null;

if (typeof window !== 'undefined') {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDNsO_LnQ7t3L_KWejjCuUQxxkI3r0iRxM',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'ignite-strategies-313c0.firebaseapp.com',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ignite-strategies-313c0',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'ignite-strategies-313c0.firebasestorage.app',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '252461468255',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:252461468255:web:0d62b1a63e3e8da77329ea',
  };

  // Initialize Firebase
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
}

// Export auth instance (null on server, initialized on client)
export { auth };

// Auth helpers
export async function signInWithGoogle() {
  if (typeof window === 'undefined') {
    throw new Error('signInWithGoogle can only be called on the client');
  }
  const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return {
    uid: result.user.uid,
    email: result.user.email,
    name: result.user.displayName,
    photoURL: result.user.photoURL,
  };
}

export async function signInWithEmail(email, password) {
  if (typeof window === 'undefined') {
    throw new Error('signInWithEmail can only be called on the client');
  }
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  const result = await signInWithEmailAndPassword(auth, email, password);
  return {
    uid: result.user.uid,
    email: result.user.email,
    name: result.user.displayName,
    photoURL: result.user.photoURL,
  };
}
