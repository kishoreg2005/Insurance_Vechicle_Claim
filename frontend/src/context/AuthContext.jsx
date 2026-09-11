import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { getDatabase, ref, set, get } from 'firebase/database';
import { auth, app } from '../services/firebase';
import api from '../services/api';

const AuthContext = createContext(null);

const getFirebaseErrorMessage = (error) => {
  const code = error?.code || '';
  if (code === 'auth/email-already-in-use') {
    return 'This email is already registered. Please sign in instead.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Email/password sign-in is not enabled in Firebase Console.';
  }
  if (code === 'auth/weak-password') {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (
    code === 'auth/user-not-found' ||
    code === 'auth/wrong-password' ||
    code === 'auth/invalid-credential'
  ) {
    return 'Invalid email or password. Please verify your credentials or register first.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many failed login attempts. Please wait a moment and try again.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error connecting to Firebase. Please check your internet connection.';
  }
  return error?.message || 'Authentication failed. Please try again.';
};

async function ensureRealtimeSession() {
  // Keep a Firebase Auth session so RTDB websocket/auth works when rules require auth.
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
  } catch (err) {
    // Anonymous auth may be disabled; open RTDB rules still allow access for demo mode.
    console.warn('[AuthContext] Could not establish anonymous Firebase session for RTDB:', err?.code || err?.message);
  }
}

async function writeUserProfile(uid, userData) {
  try {
    const db = getDatabase(app);
    await set(ref(db, `users/${uid}`), userData);
  } catch (dbErr) {
    console.warn('[AuthContext] Could not write user to RTDB:', dbErr?.code || dbErr?.message);
  }
}

async function readUserProfile(uid) {
  try {
    const db = getDatabase(app);
    const userSnap = await get(ref(db, `users/${uid}`));
    if (userSnap.exists()) return userSnap.val();
  } catch (dbErr) {
    console.warn('[AuthContext] RTDB user profile fetch error:', dbErr?.code || dbErr?.message);
  }
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && !firebaseUser.isAnonymous) {
        try {
          let userRole = 'user';
          let userName = firebaseUser.displayName || 'Authorized User';
          const profile = await readUserProfile(firebaseUser.uid);
          if (profile?.role) userRole = profile.role;
          if (profile?.name) userName = profile.name;

          const existingLocal = localStorage.getItem('user');
          if (existingLocal) {
            try {
              const parsed = JSON.parse(existingLocal);
              if (parsed.email === firebaseUser.email && parsed.role) userRole = parsed.role;
              if (parsed.name) userName = parsed.name;
            } catch {}
          }

          const userData = {
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            name: userName,
            email: firebaseUser.email,
            role: userRole,
            created_at: firebaseUser.metadata?.creationTime || new Date().toISOString(),
            is_active: true
          };

          // Prefer existing backend JWT if present; otherwise keep Firebase ID token
          if (!localStorage.getItem('token')) {
            const token = await firebaseUser.getIdToken();
            localStorage.setItem('token', token);
          }

          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (err) {
          console.error('[AuthContext] Auth state change error:', err);
        }
      } else if (!localStorage.getItem('token')) {
        setUser(null);
        localStorage.removeItem('user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async (name, email, password, role = 'user') => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      await updateProfile(firebaseUser, { displayName: name });

      const userData = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        name,
        email,
        role: role || 'user',
        created_at: new Date().toISOString(),
        is_active: true
      };

      await writeUserProfile(firebaseUser.uid, userData);

      // Prefer backend JWT for API calls
      try {
        const res = await api.post('/auth/register', { name, email, password, role });
        if (res.data?.access_token) {
          localStorage.setItem('token', res.data.access_token);
          if (res.data.user?.id) {
            userData.id = res.data.user.id;
          }
        } else {
          localStorage.setItem('token', await firebaseUser.getIdToken());
        }
      } catch {
        localStorage.setItem('token', await firebaseUser.getIdToken());
      }

      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { user: userData, token: localStorage.getItem('token') };
    } catch (error) {
      console.error('[AuthContext] Registration error:', error);
      const friendlyMessage = getFirebaseErrorMessage(error);
      const customErr = new Error(friendlyMessage);
      customErr.response = { data: { detail: friendlyMessage, error: friendlyMessage } };
      throw customErr;
    }
  };

  const login = async (email, password, role) => {
    let firebaseOk = false;
    let backendOk = false;
    let token = null;
    let userData = null;
    let lastError = null;

    // 1. Firebase Auth (keeps RTDB session authenticated)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      firebaseOk = true;

      let userRole = role || 'user';
      let userName = firebaseUser.displayName || 'Authorized User';
      const profile = await readUserProfile(firebaseUser.uid);
      if (profile?.role) userRole = profile.role;
      if (profile?.name) userName = profile.name;

      userData = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        name: userName,
        email: firebaseUser.email,
        role: userRole,
        created_at: firebaseUser.metadata?.creationTime || new Date().toISOString(),
        is_active: true
      };
      token = await firebaseUser.getIdToken();
    } catch (fbErr) {
      console.warn('[AuthContext] Firebase Auth sign-in failed, trying backend fallback:', fbErr?.code || fbErr?.message);
      lastError = fbErr;
    }

    // 2. Backend auth (source of truth for seeded admin/demo accounts + API JWT)
    try {
      const res = await api.post('/auth/login', { email, password, role });
      token = res.data.access_token || res.data.token;
      const bUser = res.data.user;
      userData = {
        id: bUser.id,
        uid: bUser.uid || bUser.id,
        name: bUser.name,
        email: bUser.email,
        role: bUser.role || role || 'user',
        created_at: bUser.created_at || new Date().toISOString(),
        is_active: bUser.is_active !== false
      };
      backendOk = true;
    } catch (backendErr) {
      if (!firebaseOk) {
        console.error('[AuthContext] Both Firebase and Backend Auth failed:', backendErr);
        const friendlyMessage =
          backendErr.response?.data?.detail ||
          backendErr.response?.data?.error ||
          (lastError ? getFirebaseErrorMessage(lastError) : 'Invalid email or password.');
        const customErr = new Error(friendlyMessage);
        customErr.response = { data: { detail: friendlyMessage, error: friendlyMessage } };
        throw customErr;
      }
    }

    if (!userData) {
      throw new Error('Login failed. Please try again.');
    }

    // 3. Portal role enforcement
    if (role && userData.role && userData.role !== role) {
      if (role === 'admin' && userData.role === 'user') {
        throw new Error('Access denied: This account is registered as a Policyholder, not an Insurance Officer.');
      }
      if (role === 'user' && userData.role === 'admin') {
        throw new Error('Access denied: This account is registered as an Insurance Officer. Please use the Officer Portal.');
      }
    }

    // 4. If backend login worked but Firebase Auth did not, open an anonymous RTDB session
    if (backendOk && !firebaseOk) {
      await ensureRealtimeSession();
    }

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    return { user: userData, token };
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('[AuthContext] Firebase signOut error:', e);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
