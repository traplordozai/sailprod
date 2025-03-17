// src/components/ProtectedRoute.tsx
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { verifyToken, refreshToken } from '../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('access_token');

      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        // Verify the token is valid
        const isValid = await verifyToken(token);
        setIsAuthenticated(isValid);

        if (!isValid) {
          // Try to refresh the token
          const refreshTokenValue = localStorage.getItem('refresh_token');
          if (refreshTokenValue) {
            try {
              const newAccessToken = await refreshToken(refreshTokenValue);
              localStorage.setItem('access_token', newAccessToken);
              setIsAuthenticated(true);
            } catch (refreshError) {
              // Refresh token is also invalid
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              setIsAuthenticated(false);
            }
          }
        }
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, []);

  if (isLoading) {
    // Show loading state while validating token
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // User is not authenticated, redirect to login
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected route
  return <>{children}</>;
};

export default ProtectedRoute;