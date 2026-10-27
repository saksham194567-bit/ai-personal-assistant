/**
 * src/context/AuthContext.jsx
 *
 * Provides Firebase authentication state across the application.
 * Syncs user profile with the Express/MongoDB backend upon sign in.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from '../config/firebase';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // Sync user profile with MongoDB backend
  async function syncBackend(user) {
    if (!user) return;
    try {
      await api.auth.syncUser({
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || '',
      });
    } catch (err) {
      console.warn('Backend user sync warning (backend may be offline):', err.message);
    }
  }

  useEffect(() => {
    // Listen for Firebase auth state changes
    try {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        setCurrentUser(user);
        if (user) {
          await syncBackend(user);
        }
        setLoading(false);
      });
      return unsubscribe;
    } catch (err) {
      console.warn('Firebase auth listener fallback:', err.message);
      setLoading(false);
    }
  }, []);

  async function loginWithEmail(email, password) {
    setAuthError('');
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      await syncBackend(res.user);
      return res.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  }

  async function signupWithEmail(email, password, displayName) {
    setAuthError('');
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(res.user, { displayName });
      }
      await syncBackend({ ...res.user, displayName });
      return res.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  }

  async function loginWithGoogle() {
    setAuthError('');
    try {
      const res = await signInWithPopup(auth, googleProvider);
      await syncBackend(res.user);
      return res.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  }

  async function logout() {
    setAuthError('');
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  }

  const value = {
    currentUser,
    loading,
    authError,
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
