/**
 * File: frontend/src/App.tsx
 * Purpose: Root application component and routing setup
 */

import React from 'react'
import * as React from 'react';
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import LandingAndLogin from './pages/LandingAndLogin';
import AdminLayout from './pages/Admin/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard';
import Students from './pages/Admin/Students';
import Organizations from './pages/Admin/Organizations';
import Faculty from './pages/Admin/Faculty';
import Matching from './pages/Admin/Matching';
import Matches from './pages/Admin/Matches';
import Grading from './pages/Admin/Grading';
import StudentProfilePage from "./pages/StudentProfile";
import ConnectionStatus from './components/ConnectionStatus';
import { validateAuthState, hasPermission } from './services/authUtils';

// Error boundary for production use
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 border border-red-300 rounded">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
          <p className="mb-4">Please try refreshing the page or contact support if the problem persists.</p>
          <pre className="bg-red-100 p-2 rounded text-sm overflow-auto">
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Protected route component
interface ProtectedRouteProps {
  element: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
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
        // Just assume we're authenticated if we have a token
        const accessToken = localStorage.getItem('access_token');
        
        if (isMounted) {
          setIsAuthenticated(!!accessToken);
          setIsAuthorized(true); // Always authorize
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };
    
    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  // Show loading while checking authentication
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
                onClick={() => window.location.href = '/'}
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

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Redirect to dashboard if authenticated but not authorized
  if (!isAuthorized) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Render the protected component
  return <>{element}</>;
};

// Unauthorized access page
const Unauthorized = () => (
  <div className="flex flex-col items-center justify-center h-screen">
    <h1 className="text-2xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
    <p className="mb-4">You don't have permission to access this page.</p>
    <button 
      onClick={() => window.location.href = '/'} 
      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
    >
      Return to Login
    </button>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          <ConnectionStatus />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingAndLogin />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Admin routes - protected */}
            <Route 
              path="/admin" 
              element={<ProtectedRoute element={<AdminLayout />} />}
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="students" element={<Students />} />
              <Route path="organizations" element={<Organizations />} />
              <Route path="faculty" element={<Faculty />} />
              <Route path="matching" element={<Matching />} />
              <Route path="matches" element={<Matches />} />
              <Route path="grading" element={<Grading />} />
            </Route>

            {/* Student Profile route - protected */}
            <Route 
              path="/students/:studentId/profile" 
              element={<ProtectedRoute element={<StudentProfilePage />} />} 
            />

            {/* 404 route */}
            <Route path="*" element={
              <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Page Not Found</h1>
                <p className="text-gray-600">The page you're looking for doesn't exist.</p>
                <button 
                  onClick={() => window.location.href = '/'} 
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Return Home
                </button>
              </div>
            } />
          </Routes>
        </div>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
