/**
 * File: frontend/src/services/authUtils.ts
 * Purpose: Utility functions for authentication and authorization
 */
import { queryClient } from '../lib/queryClient';

interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: number;
    username: string;
    roles: string[];
  } | null;
  error: string | null;
}

/**
 * Validates the authentication state by checking token with backend
 */
export const validateAuthState = async (): Promise<AuthState> => {
  const accessToken = localStorage.getItem('access_token');
  
  if (!accessToken) {
    return {
      isAuthenticated: false,
      user: null,
      error: null
    };
  }

  try {
    const response = await fetch('/api/auth/verify/', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      // Token invalid - clear storage
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_roles');
        queryClient.clear();
      }
      throw new Error(`Token verification failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Store roles in localStorage for easier access
    if (data.user?.roles) {
      localStorage.setItem('user_roles', JSON.stringify(data.user.roles));
    }

    return {
      isAuthenticated: true,
      user: data.user,
      error: null
    };
  } catch (error) {
    console.error('Auth validation error:', error);
    return {
      isAuthenticated: false,
      user: null,
      error: error instanceof Error ? error.message : 'Authentication failed'
    };
  }
};

/**
 * Gets user roles from localStorage
 */
export const getUserRoles = (): string[] => {
  try {
    const rolesString = localStorage.getItem('user_roles');
    return rolesString ? JSON.parse(rolesString) : [];
  } catch (e) {
    console.error('Error parsing user roles:', e);
    return [];
  }
};

/**
 * Checks if the user has required roles
 */
export const hasPermission = (allowedRoles: string | string[]): boolean => {
  const userRoles = getUserRoles();
  const requiredRoles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  // If no allowed roles specified, deny access
  if (!requiredRoles.length) return false;
  
  // If 'any' is in allowedRoles, allow any authenticated user
  if (requiredRoles.includes('any')) return true;
  
  // Check if user has any of the required roles
  return userRoles.some(role => requiredRoles.includes(role));
};

/**
 * Checks if user has admin permission
 */
export const isAdmin = (): boolean => {
  const userRoles = getUserRoles();
  return userRoles.some(role => ['admin', 'Admin'].includes(role));
}; 