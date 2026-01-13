// Authentication Service
// This service handles all authentication-related API calls

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Helper function for making API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  // Add auth token if available
  const token = localStorage.getItem("authToken");
  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    // Handle empty responses
    const text = await response.text();
    let data = null;
    
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        // Response is not JSON
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        return { success: true, message: text };
      }
    }

    if (!response.ok) {
      throw new Error(data?.message || `Request failed with status ${response.status}`);
    }

    return data || { success: true };
  } catch (error) {
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
}

// Register a new user
export async function registerUser(fullName, email, password) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({ fullName, email, password }),
  });
}

// Login user
export async function loginUser(email, password) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// Verify email with token
export async function verifyEmail(token) {
  return apiRequest(`/auth/verify-email?token=${token}`, {
    method: "GET",
  });
}

// Resend verification email
export async function resendVerificationEmail(email) {
  return apiRequest("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

// Request password reset
export async function forgotPassword(email) {
  return apiRequest("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

// Reset password with token
export async function resetPassword(token, newPassword) {
  return apiRequest("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}

// Get current user profile
export async function getCurrentUser() {
  return apiRequest("/auth/me", {
    method: "GET",
  });
}

// Update user profile
export async function updateProfile(userData) {
  return apiRequest("/auth/profile", {
    method: "PUT",
    body: JSON.stringify(userData),
  });
}

// Change password (when logged in)
export async function changePassword(currentPassword, newPassword) {
  return apiRequest("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

// Logout (invalidate token on server if needed)
export async function logoutUser() {
  try {
    await apiRequest("/auth/logout", {
      method: "POST",
    });
  } catch (error) {
    // Even if server logout fails, clear local storage
    console.error("Server logout failed:", error);
  }
  
  localStorage.removeItem("user");
  localStorage.removeItem("authToken");
}

// Validate email format
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
export function validatePassword(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Check if user is authenticated
export function isAuthenticated() {
  const token = localStorage.getItem("authToken");
  const user = localStorage.getItem("user");
  return !!(token && user);
}

// Get stored auth token
export function getAuthToken() {
  return localStorage.getItem("authToken");
}

// Get stored user data
export function getStoredUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}
