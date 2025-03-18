import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Function to get tokens from localStorage
const getTokens = () => {
  return {
    access: localStorage.getItem('access_token'),
    refresh: localStorage.getItem('refresh_token'),
  };
};

// Function to set tokens in localStorage
const setTokens = (access: string, refresh: string) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};

// Function to remove tokens from localStorage
const removeTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_role');
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add a request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add token to request headers if available
    const tokens = getTokens();
    if (tokens.access && config.headers) {
      config.headers.Authorization = `Bearer ${tokens.access}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for token refreshing
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokens = getTokens();
        if (!tokens.refresh) throw new Error('No refresh token available');

        // Try to get a new access token
        const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
          refresh: tokens.refresh,
        });

        // Save the new tokens
        setTokens(response.data.access, tokens.refresh);

        // Update the failed request's Authorization header and retry
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        removeTokens();
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Authentication API functions
export const login = async (email: string, password: string) => {
  try {
    const response = await apiClient.post('/auth/login/', { email, password });
    setTokens(response.data.access, response.data.refresh);
    localStorage.setItem('user_role', response.data.user.role);
    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

export const logout = () => {
  removeTokens();
};

// Test connection function (publicly accessible)
export const testConnection = async () => {
  try {
    const response = await apiClient.get('/test-connection/');
    return response.data;
  } catch (error) {
    console.error('API connection test failed:', error);
    throw error;
  }
};

export default apiClient;