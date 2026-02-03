import { createContext, useState, useContext, useEffect } from 'react';
import {
  onAuthChange,
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
} from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getCurrentUser();
          setUser(profile);
        } catch {
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


  const login = async (email, password) => {
    const response = await loginUser(email, password);
    setUser(response.user);
    return response;
  };

  
  const register = async (userData) => {
    const response = await registerUser(userData);
    setUser(response.user);
    return response;
  };


  const logout = async () => {
    await logoutUser();
    setUser(null);
  };


  const refreshUser = async () => {
    const profile = await getCurrentUser();
    setUser(profile);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};