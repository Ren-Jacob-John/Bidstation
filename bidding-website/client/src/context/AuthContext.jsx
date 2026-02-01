import { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('No token found in localStorage');
      setLoading(false);
      return;
    }

    try {
      console.log('Checking authentication...');
      const userData = await authService.getMe();
      console.log('User authenticated:', userData.username);
      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error.response?.data?.message || error.message);
      
      // Only clear token if it's actually invalid
      // Don't clear on network errors
      if (error.response?.status === 401) {
        console.log('Token invalid, clearing localStorage');
        localStorage.removeItem('token');
        setUser(null);
      } else {
        console.log('Network error, keeping token for retry');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Logging in...');
      const response = await authService.login(email, password);
      
      if (!response.token) {
        throw new Error('No token received from server');
      }
      
      localStorage.setItem('token', response.token);
      setUser(response.user);
      console.log('Login successful:', response.user.username);
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      console.log('Registering new user...');
      const response = await authService.register(userData);
      
      if (!response.token) {
        throw new Error('No token received from server');
      }
      
      localStorage.setItem('token', response.token);
      setUser(response.user);
      console.log('Registration successful:', response.user.username);
      
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('Logging out...');
    localStorage.removeItem('token');
    setUser(null);
  };

  // Refresh user data (useful after updates)
  const refreshUser = async () => {
    try {
      const userData = await authService.getMe();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Refresh user failed:', error);
      if (error.response?.status === 401) {
        logout();
      }
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};