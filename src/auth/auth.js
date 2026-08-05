import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { CONFIG } from '../config.js';

let auth = null;
let googleProvider = null;
let firebaseInitialized = false;

try {
  if (CONFIG.FIREBASE.apiKey && CONFIG.FIREBASE.apiKey !== 'YOUR_FIREBASE_API_KEY') {
    const app = getApps().length === 0 ? initializeApp(CONFIG.FIREBASE) : getApps()[0];
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    firebaseInitialized = true;
  }
} catch (err) {
  console.warn('Firebase init deferred (placeholder keys detected). App running in Local Mode.', err);
}

// Local mock user state for demo mode
let currentUser = JSON.parse(localStorage.getItem('contentlist_local_user') || 'null');
const listeners = [];

export function isFirebaseConfigured() {
  return firebaseInitialized;
}

export function subscribeAuth(callback) {
  listeners.push(callback);
  if (firebaseInitialized && auth) {
    return onAuthStateChanged(auth, (user) => {
      currentUser = user;
      callback(user);
    });
  } else {
    callback(currentUser);
    return () => {};
  }
}

export async function loginWithGoogle() {
  if (firebaseInitialized && auth && googleProvider) {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err) {
      console.error('Google Auth Error:', err);
      throw err;
    }
  } else {
    // Fallback local demo sign in
    currentUser = {
      uid: 'demo_user_123',
      displayName: 'Demo User',
      email: 'user@contentlist.app',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ContentList'
    };
    localStorage.setItem('contentlist_local_user', JSON.stringify(currentUser));
    listeners.forEach(cb => cb(currentUser));
    return currentUser;
  }
}

export async function logout() {
  if (firebaseInitialized && auth) {
    await firebaseSignOut(auth);
  } else {
    currentUser = null;
    localStorage.removeItem('contentlist_local_user');
    listeners.forEach(cb => cb(null));
  }
}

export function getCurrentUser() {
  return currentUser;
}
