/**
 * File: frontend/src/components/DirectLogin.tsx
 * Purpose: Component for direct login functionality
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiBaseUrl, getAdminUrl, API_ENDPOINTS } from '../utils/apiConfig';

// Simple form that makes a direct request to Django's token endpoint
const DirectLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const apiUrl = getApiBaseUrl();
  const adminUrl = getAdminUrl();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Try direct token authentication
      const response = await fetch(`${apiUrl}${API_ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Direct login failed:', response.status, errorData);
        throw new Error(errorData.detail || 'Authentication failed');
      }

      const data = await response.json();
      console.log('Direct login successful');

      // Store authentication data
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user_role', 'admin');
      
      // Redirect to the admin dashboard
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Error during direct login:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto mt-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Direct Admin Login</h2>
      <p className="text-sm text-gray-600 mb-4">
        Use your Django admin credentials to log in directly.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>
        
        <div className="text-center mt-4">
          <a
            href={`${adminUrl}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-purple-600 hover:text-purple-800"
          >
            Or access the Django admin interface directly
          </a>
        </div>
      </form>
    </div>
  );
};

export default DirectLogin; 
