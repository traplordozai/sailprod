/**
 * Shared API configuration utilities
 */

/**
 * Get the base API URL based on current environment
 * This function is used throughout the application for consistent API endpoint handling
 */
export const getApiBaseUrl = (): string => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // For local development, connect to port 8001
    return `${protocol}//${hostname}:8001/api`;
  } else {
    // For production, use same hostname but with API path
    return `${protocol}//${hostname}/api`;
  }
};

/**
 * Get the admin URL based on current environment
 */
export const getAdminUrl = (): string => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // For local development, connect to port 8001
    return `${protocol}//${hostname}:8001/admin`;
  } else {
    // For production, use same hostname but with admin path
    return `${protocol}//${hostname}/admin`;
  }
};

/**
 * API endpoints for various services
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/token/',
    REFRESH: '/token/refresh/',
    VERIFY: '/token/verify/',
    REGISTER: '/sail/auth/register/',
  },
  DASHBOARD: {
    STATS: '/dashboard/stats/',
    STATS_BACKUP: '/public/stats/',
    STATS_FALLBACK: '/no-auth/dashboard/stats/',
    ACTIVITY: '/dashboard/activity/'
  },
  // Add more endpoints as needed
};

export default {
  getApiBaseUrl,
  getAdminUrl,
  API_ENDPOINTS
}; 