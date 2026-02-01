import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log the error for debugging
    console.error('API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      url: error.config?.url,
      method: error.config?.method
    });

    // Only logout on 401 if it's actually an auth issue
    // Don't logout on other errors
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.message?.toLowerCase() || '';
      
      // Only logout if it's a token-related issue
      if (
        errorMessage.includes('token') || 
        errorMessage.includes('authorization') ||
        errorMessage.includes('not valid') ||
        errorMessage.includes('expired')
      ) {
        console.warn('Authentication failed - logging out');
        localStorage.removeItem('token');
        
        // Don't redirect if already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;