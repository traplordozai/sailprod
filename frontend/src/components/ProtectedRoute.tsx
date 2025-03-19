/**
 * File: frontend/src/components/ProtectedRoute.tsx
 * Purpose: Route wrapper component for authentication protection
 */

import React from 'react'
import { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { validateAuthState, hasPermission } from '../services/authUtils';

interface ProtectedRouteProps {
  element: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  element, 
  allowedRoles = ['Admin', 'admin'] 
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const authState = await validateAuthState();
        
        if (!isMounted) return;
        
        setIsAuthenticated(authState.isAuthenticated);
        setAuthError(authState.error);
        
        if (authState.isAuthenticated) {
          setIsAuthorized(hasPermission(allowedRoles));
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (isMounted) {
          setIsAuthenticated(false);
          setIsAuthorized(false);
          setAuthError('Authentication verification failed');
        }
      }
    };
    
    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, [location.pathname, allowedRoles]);

  if (isAuthenticated === null || isAuthorized === null) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mb-4"></div>
        <p className="text-gray-600">Verifying authentication...</p>
        {authError && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 max-w-md text-center">
            {authError}
            <div className="mt-2">
              <button 
                onClick={() => navigate('/')}
                className="text-sm text-purple-700 hover:text-purple-900"
              >
                Return to Login
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (!isAuthorized) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{element}</>;
};
