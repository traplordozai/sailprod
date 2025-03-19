/**
 * File: frontend/src/services/authService.ts
 * Purpose: Authentication service for handling user sessions
 */

import { api } from './api'
import { getApiBaseUrl, API_ENDPOINTS } from '../utils/apiConfig';

const API_URL = getApiBaseUrl();

interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    email: string;
    role: string;
  };
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'Student' | 'Faculty' | 'Organization';
  orgName?: string;
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const loginData = {
    username: email,
    password: password,
  };
  
  const response = await fetch(`${API_URL}${API_ENDPOINTS.AUTH.LOGIN}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(loginData),
  });
  
  if (!response.ok) {
    throw new Error('Invalid credentials. Please check your username and password.');
  }
  
  const data: LoginResponse = await response.json();
  
  // Store token strings directly
  localStorage.setItem('access_token', data.access);
  localStorage.setItem('refresh_token', data.refresh);
  localStorage.setItem('user_role', data.user.role || 'admin');
  localStorage.setItem('token_last_verified', Date.now().toString());
  
  return data;
};

export async function register(data: RegisterData): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/sail/auth/register/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: data.email,
      password: data.password,
      first_name: data.firstName,
      last_name: data.lastName, 
      role: data.role,
      organization_name: data.orgName
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.detail || 'Registration failed');
    console.error('Registration error:', error);
    throw error;
  }

  return await response.json();
}

export async function refreshToken(refreshToken: string): Promise<string> {
  const response = await fetch(`${API_URL}${API_ENDPOINTS.AUTH.REFRESH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Your session has expired. Please log in again.');
  }

  const data = await response.json();
  // Return just the access token string
  return data.access;
}

export function logout(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_role');
  window.location.href = '/';
}

export const verifyToken = async (token: string): Promise<boolean> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  
  try {
    const response = await fetch(`${API_URL}${API_ENDPOINTS.AUTH.VERIFY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      localStorage.setItem('token_last_verified', Date.now().toString());
      return true;
    }
    
    return false;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && 
       (error.message.includes('Network Error') || 
        error.message.includes('Failed to fetch'))) {
      const lastVerified = localStorage.getItem('token_last_verified');
      if (lastVerified) {
        const lastVerifiedTime = parseInt(lastVerified, 10);
        if (Date.now() - lastVerifiedTime < 60 * 60 * 1000) {
          return true;
        }
      }
    }
    
    return false;
  }
};

export const isAuthenticated = (): boolean => {
  const isAuth = !!localStorage.getItem('access_token');
  if (isAuth) {
    localStorage.setItem('token_last_verified', Date.now().toString());
  }
  return isAuth;
};

export const getCurrentUserRole = (): string | null => {
  return localStorage.getItem('user_role');
};
