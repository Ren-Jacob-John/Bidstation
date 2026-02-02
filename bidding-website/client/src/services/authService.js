import api from './api';

export const authService = {
  // Register user
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login user
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // Get current user
  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Verify email with token
  async verifyEmail(token) {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  },

  // Resend verification email
  async resendVerification() {
    const response = await api.post('/auth/resend-verification');
    return response.data;
  },

  // Request password reset
  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password with token
  async resetPassword(token, newPassword) {
    const response = await api.post('/auth/reset-password', { 
      token, 
      newPassword 
    });
    return response.data;
  }
};