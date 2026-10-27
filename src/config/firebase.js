/**
 * src/config/firebase.js
 *
 * Frontend Firebase Client SDK initialization.
 * Configured for project: ai-personal-assistant-e8b70
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCp7djOiNOTdlnONjNpCaNfXTa11ahnNDc',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'ai-personal-assistant-e8b70.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'ai-personal-assistant-e8b70',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'ai-personal-assistant-e8b70.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '153955493214',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:153955493214:web:7dc12a546a86522b085bcf',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-8N52TY2NE0',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
};
