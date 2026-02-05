// ---------------------------------------------------------------------------
// client/src/utils/helpers.js - Utility Functions
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Currency Formatting
// ---------------------------------------------------------------------------
export const formatCurrency = (amount, currency = 'INR', locale = 'en-IN') => {
  if (amount === null || amount === undefined) return '₹0';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatCurrencyShort = (amount) => {
  if (amount === null || amount === undefined) return '₹0';
  
  const absAmount = Math.abs(amount);
  
  if (absAmount >= 10000000) { // 1 Crore
    return `₹${(amount / 10000000).toFixed(2)}Cr`;
  } else if (absAmount >= 100000) { // 1 Lakh
    return `₹${(amount / 100000).toFixed(2)}L`;
  } else if (absAmount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  
  return formatCurrency(amount);
};

// ---------------------------------------------------------------------------
// Date & Time Formatting
// ---------------------------------------------------------------------------
export const formatDate = (date, format = 'full') => {
  if (!date) return '';
  
  const d = new Date(date);
  
  const formats = {
    full: { year: 'numeric', month: 'long', day: 'numeric' },
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    numeric: { year: 'numeric', month: '2-digit', day: '2-digit' },
    long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
  };
  
  return d.toLocaleDateString('en-IN', formats[format] || formats.full);
};

export const formatTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateTime = (date) => {
  if (!date) return '';
  return `${formatDate(date, 'short')} at ${formatTime(date)}`;
};

export const getRelativeTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const target = new Date(date);
  const diffMs = target - now;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMs < 0) {
    // Past
    const absDays = Math.abs(diffDays);
    const absHours = Math.abs(diffHours);
    const absMins = Math.abs(diffMins);
    
    if (absDays > 7) return formatDate(date, 'short');
    if (absDays > 0) return `${absDays} day${absDays > 1 ? 's' : ''} ago`;
    if (absHours > 0) return `${absHours} hour${absHours > 1 ? 's' : ''} ago`;
    if (absMins > 0) return `${absMins} minute${absMins > 1 ? 's' : ''} ago`;
    return 'Just now';
  } else {
    // Future
    if (diffDays > 7) return formatDate(date, 'short');
    if (diffDays > 0) return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    if (diffMins > 0) return `in ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    return 'Starting soon';
  }
};

export const isDatePast = (date) => {
  return new Date(date) < new Date();
};

export const isDateFuture = (date) => {
  return new Date(date) > new Date();
};

// ---------------------------------------------------------------------------
// String Formatting
// ---------------------------------------------------------------------------
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const capitalizeWords = (str) => {
  if (!str) return '';
  return str.split(' ').map(capitalize).join(' ');
};

export const truncate = (str, maxLength = 50, suffix = '...') => {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
};

export const slugify = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// ---------------------------------------------------------------------------
// Number Formatting
// ---------------------------------------------------------------------------
export const formatNumber = (num, decimals = 0) => {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });
};

export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0%';
  return `${value.toFixed(decimals)}%`;
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password) => {
  // At least 6 characters
  return password && password.length >= 6;
};

export const isValidUsername = (username) => {
  // 3-20 characters, alphanumeric and underscore only
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

export const isValidBid = (bidAmount, currentBid, minIncrement = 100000) => {
  if (!bidAmount || bidAmount <= 0) return false;
  if (bidAmount <= currentBid) return false;
  if (bidAmount - currentBid < minIncrement) return false;
  return true;
};

// ---------------------------------------------------------------------------
// Array & Object Utilities
// ---------------------------------------------------------------------------
export const sortByKey = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    const valA = a[key];
    const valB = b[key];
    
    if (valA < valB) return order === 'asc' ? -1 : 1;
    if (valA > valB) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};

export const uniqueBy = (array, key) => {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

// ---------------------------------------------------------------------------
// Status Helpers
// ---------------------------------------------------------------------------
export const getAuctionStatus = (auction) => {
  if (!auction) return 'unknown';
  
  const now = new Date();
  const start = new Date(auction.startDate);
  const end = new Date(auction.endDate);
  
  if (now < start) return 'upcoming';
  if (now > end) return 'completed';
  return 'live';
};

export const getStatusColor = (status) => {
  const colors = {
    upcoming: '#f59e0b', // orange
    live: '#22c55e',     // green
    completed: '#ef4444', // red
    active: '#22c55e',
    outbid: '#6b7280',   // gray
    won: '#22c55e',
    lost: '#ef4444',
  };
  
  return colors[status] || '#6b7280';
};

export const getStatusLabel = (status) => {
  const labels = {
    upcoming: 'Upcoming',
    live: 'Live',
    completed: 'Completed',
    active: 'Winning',
    outbid: 'Outbid',
    won: 'Won',
    lost: 'Lost',
    available: 'Available',
    sold: 'Sold',
    unsold: 'Unsold',
  };
  
  return labels[status] || capitalize(status);
};

// ---------------------------------------------------------------------------
// Local Storage Helpers
// ---------------------------------------------------------------------------
export const saveToLocalStorage = (key, value) => {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

export const getFromLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

export const removeFromLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing from localStorage:', error);
    return false;
  }
};

// ---------------------------------------------------------------------------
// Debounce & Throttle
// ---------------------------------------------------------------------------
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit = 300) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// ---------------------------------------------------------------------------
// Copy to Clipboard
// ---------------------------------------------------------------------------
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};

// ---------------------------------------------------------------------------
// Generate Random ID
// ---------------------------------------------------------------------------
export const generateId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}-${timestamp}-${randomStr}` : `${timestamp}-${randomStr}`;
};

// ---------------------------------------------------------------------------
// Error Message Formatter
// ---------------------------------------------------------------------------
export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

// ---------------------------------------------------------------------------
// Sport Icon Mapper
// ---------------------------------------------------------------------------
export const getSportIcon = (sport) => {
  const icons = {
    IPL: '🏏',
    PKL: '🤼',
    ISL: '⚽',
    HIL: '🏑',
    PBL: '🏸',
    UTT: '🏓',
    PVL: '🏐',
    IBL: '🏀',
    PWL: '🤼‍♂️',
  };
  
  return icons[sport] || '🏆';
};

// ---------------------------------------------------------------------------
// Calculate Time Remaining
// ---------------------------------------------------------------------------
export const getTimeRemaining = (endDate) => {
  const now = new Date();
  const end = new Date(endDate);
  const diffMs = end - now;
  
  if (diffMs <= 0) {
    return { ended: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  
  const seconds = Math.floor(diffMs / 1000) % 60;
  const minutes = Math.floor(diffMs / (1000 * 60)) % 60;
  const hours = Math.floor(diffMs / (1000 * 60 * 60)) % 24;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  return { ended: false, days, hours, minutes, seconds };
};

// ---------------------------------------------------------------------------
// Format Time Remaining
// ---------------------------------------------------------------------------
export const formatTimeRemaining = (endDate) => {
  const { ended, days, hours, minutes } = getTimeRemaining(endDate);
  
  if (ended) return 'Ended';
  
  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  if (minutes > 0) return `${minutes}m remaining`;
  return 'Less than a minute';
};

// ---------------------------------------------------------------------------
// Check if value is empty
// ---------------------------------------------------------------------------
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

export default {
  formatCurrency,
  formatCurrencyShort,
  formatDate,
  formatTime,
  formatDateTime,
  getRelativeTime,
  isDatePast,
  isDateFuture,
  capitalize,
  capitalizeWords,
  truncate,
  slugify,
  formatNumber,
  formatPercentage,
  isValidEmail,
  isValidPassword,
  isValidUsername,
  isValidBid,
  sortByKey,
  groupBy,
  uniqueBy,
  getAuctionStatus,
  getStatusColor,
  getStatusLabel,
  saveToLocalStorage,
  getFromLocalStorage,
  removeFromLocalStorage,
  debounce,
  throttle,
  copyToClipboard,
  generateId,
  getErrorMessage,
  getSportIcon,
  getTimeRemaining,
  formatTimeRemaining,
  isEmpty,
};
