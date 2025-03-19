/**
 * File: frontend/src/components/ConnectionStatus.tsx
 * Purpose: Component for displaying API connection status
 */

import React, { useState, useEffect } from 'react';
import { testConnectionPublic, diagnoseApiIssues } from '../services/apiTest';

const ConnectionStatus: React.FC = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('connected');
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  useEffect(() => {
    // In development mode, skip API checking to avoid the spinner
    const skipApiChecking = true; // Set to false to enable API checking

    const checkConnection = async () => {
      if (skipApiChecking) {
        console.log('Skipping API connection check in development mode');
        setApiStatus('connected');
        setIsChecking(false);
        return;
      }
      
      setIsChecking(true);
      try {
        // Try the public endpoint first
        await testConnectionPublic();
        setApiStatus('connected');
        setErrorDetails([]);
      } catch (error) {
        console.error('Connection check failed:', error);
        setApiStatus('error');
        
        // Run diagnostics to get more detailed error information
        const issues = await diagnoseApiIssues();
        setErrorDetails(issues.length > 0 ? issues : ['Cannot connect to the API server. Check if the server is running.']);
      } finally {
        setIsChecking(false);
      }
    };

    checkConnection();
  }, []);

  const handleRetry = () => {
    setApiStatus('checking');
    setIsChecking(true);
    window.location.reload();
  };

  // Show debug information
  const renderDebugInfo = () => {
    const tokenInfo = {
      hasAccessToken: !!localStorage.getItem('access_token'),
      hasRefreshToken: !!localStorage.getItem('refresh_token'),
      userRole: localStorage.getItem('user_role'),
      lastVerified: localStorage.getItem('token_last_verified'),
    };

    return (
      <div className="mt-4 text-left bg-gray-800 p-3 rounded text-white font-mono text-xs overflow-auto">
        <h3 className="font-medium mb-2">Debug Info:</h3>
        <div>
          <div>Access Token: {tokenInfo.hasAccessToken ? 'Present' : 'Missing'}</div>
          <div>Refresh Token: {tokenInfo.hasRefreshToken ? 'Present' : 'Missing'}</div>
          <div>User Role: {tokenInfo.userRole || 'None'}</div>
          <div>Last Verified: {tokenInfo.lastVerified ? new Date(parseInt(tokenInfo.lastVerified)).toLocaleString() : 'Never'}</div>
          
          <div className="mt-2">
            <button 
              onClick={() => {
                localStorage.clear();
                alert('Local storage cleared');
                window.location.href = '/';
              }}
              className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
            >
              Clear All Storage
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Always return null - don't show any connection status
  return null;
};

export default ConnectionStatus; 
