// src/services/authService.ts
import axios from 'axios';

interface AuthTokens {
  access: string;
  refresh: string;
}

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
  role: string;
  orgName?: string;
}

const API_URL = 'http://localhost:8000/api';  // Adjust this to match your Django backend URL

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  return response.json();
}

export async function register(data: RegisterData): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/register/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Registration failed');
  }

  return response.json();
}

export async function refreshToken(token: string): Promise<{ access: string }> {
  const response = await fetch(`${API_URL}/auth/token/refresh/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh: token }),
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  return response.json();
}

export function logout(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_role');
}

export const verifyToken = async (token: string): Promise<boolean> => {
  try {
    await axios.post(`${API_URL}/api/token/verify/`, {
      token
    });
    return true;
  } catch (error) {
    return false;
  }
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('access_token');
};