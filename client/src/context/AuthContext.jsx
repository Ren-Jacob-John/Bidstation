// ---------------------------------------------------------------------------
// client/src/context/AuthContext.jsx   (Firebase version)
// ---------------------------------------------------------------------------
import { createContext, useState, useContext, useEffect } from 'react';
import {
  onAuthChange,
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
  deleteAccount as deleteAccountService,
} from '../services/authService';

const AuthContext = createContext();

// ---------------------------------------------------------------------------
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

// ---------------------------------------------------------------------------
export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // -----------------------------------------------------------------------
  // Listen to Firebase auth state – fires on mount AND on sign-in / sign-out
  // -----------------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Pull username / role / emailVerified from Firestore
          const profile = await getCurrentUser();
          setUser(profile);
        } catch {
          // Firestore read failed – use what Firebase Auth gives us
          setUser({
            id:            firebaseUser.uid,
            email:         firebaseUser.email,
            username:      '',
            role:          'bidder',
            emailVerified: firebaseUser.emailVerified,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe(); // cleanup on unmount
  }, []);

  // -----------------------------------------------------------------------
  // login
  // -----------------------------------------------------------------------
  const login = async (email, password) => {
    const response = await loginUser(email, password);
    setUser(response.user);
    return response;
  };

  // -----------------------------------------------------------------------
  // register
  // -----------------------------------------------------------------------
  const register = async (userData) => {
    const { email, password, username, role } = userData;
    const response = await registerUser(email, password, username, role);
    setUser(response.user);
    return response;
  };

  // -----------------------------------------------------------------------
  // logout
  // -----------------------------------------------------------------------
  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  // -----------------------------------------------------------------------
  // refreshUser  –  re-reads Firestore (handy after email verify)
  // -----------------------------------------------------------------------
  const refreshUser = async () => {
    const profile = await getCurrentUser();
    setUser(profile);
  };

  // -----------------------------------------------------------------------
  // deleteAccount  –  deletes user after re-auth with password
  // -----------------------------------------------------------------------
  const deleteAccount = async (currentPassword) => {
    await deleteAccountService(currentPassword);
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  // -----------------------------------------------------------------------
  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser, deleteAccount, isAuthenticated: !!user, isAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
};
