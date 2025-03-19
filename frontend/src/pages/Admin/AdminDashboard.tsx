/**
 * File: frontend/src/pages/Admin/AdminDashboard.tsx
 * Purpose: Main administrative dashboard with overview and metrics
 */

import React from 'react'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UserIcon, UserGroupIcon, ClockIcon, ShieldCheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import apiClient from '../../services/api';

// Define types for our data structures
interface StatusData {
  status: string;
  count: number;
}

interface AreaData {
  area_of_law: string;
  count: number;
}

interface DashboardStats {
  totalStudents: number;
  matchedStudents: number;
  pendingMatches: number;
  needingApproval: number;
  totalOrganizations: number;
  availablePositions: number;
  ungradedStatements: number;
  matchesByStatus: StatusData[];
  matchesByArea: AreaData[];
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

const StatCard = ({ title, value, icon, color }: StatCardProps) => (
  <div className={`p-6 bg-white rounded-lg shadow-md flex items-center space-x-4 border-l-4 ${color}`}>
    <div className={`p-3 rounded-full ${color.replace('border-', 'bg-').replace('-500', '-100')} ${color.replace('border-', 'text-')}`}>
      {icon}
    </div>
    <div>
      <p className='text-sm font-medium text-gray-500'>{title}</p>
      <p className='text-2xl font-bold'>{value}</p>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    matchedStudents: 0,
    pendingMatches: 0,
    needingApproval: 0,
    totalOrganizations: 0,
    availablePositions: 0,
    ungradedStatements: 0,
    matchesByStatus: [],
    matchesByArea: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshInterval, setRefreshInterval] = useState<number | null>(30); // Auto-refresh every 30 seconds

  // Function to fetch dashboard data from API
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // No longer require authentication token
      let response;
      let error = null;
      
      // Try main endpoint first
      try {
        response = await apiClient.get('/dashboard/stats/');
        console.log('Main dashboard endpoint successful');
      } catch (err) {
        console.warn('Main dashboard endpoint failed, trying first backup');
        error = err;
        
        // Try first backup endpoint
        try {
          response = await apiClient.get('/public/stats/');
          console.log('Backup dashboard endpoint successful');
          error = null;
        } catch (err2) {
          console.warn('Backup endpoint failed, trying second fallback');
          
          // Try second fallback endpoint
          try {
            response = await apiClient.get('/no-auth/dashboard/stats/');
            console.log('Fallback dashboard endpoint successful');
            error = null;
          } catch (err3) {
            console.error('All dashboard endpoints failed');
            throw error || err3;
          }
        }
      }
      
      const data = response.data;
      
      // Log the data received for debugging
      console.log('Dashboard data received:', data);
      
      // Transform API response to match our interface
      setStats({
        totalStudents: data.total_students || 0,
        matchedStudents: data.matched_students || 0,
        pendingMatches: data.pending_matches || 0,
        needingApproval: data.approval_needed || 0,
        totalOrganizations: data.organizations?.total || 0,
        availablePositions: data.available_positions || 0,
        ungradedStatements: data.ungraded_statements || 0,
        
        // Transform chart data to match interface
        matchesByStatus: data.match_status_chart?.map((item: any) => ({
          status: item.status,
          count: item.count
        })) || [],
        
        // Transform area chart data to match interface
        matchesByArea: data.area_law_chart?.map((item: any) => ({
          area_of_law: item.area,
          count: item.count
        })) || [],
      });
      
      setError('');
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      
      // Handle different error types
      if (err.response) {
        // Server responded with an error
        if (err.response.status === 401) {
          setError('Your session has expired. Please log in again.');
        } else if (err.response.status === 403) {
          setError('You do not have permission to access this dashboard.');
        } else {
          setError(`Server error: ${err.response.data?.detail || 'Unknown server error'}`);
        }
      } else if (err.request) {
        // No response received
        setError('Cannot connect to the server. Please check your internet connection.');
      } else {
        // Something else went wrong
        setError(`Error: ${err.message || 'Failed to load dashboard statistics'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-refresh data
  useEffect(() => {
    if (!refreshInterval) return;
    
    const intervalId = setInterval(() => {
      fetchDashboardData();
    }, refreshInterval * 1000);
    
    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  // Toggle auto-refresh
  const toggleRefresh = () => {
    if (refreshInterval) {
      setRefreshInterval(null); // Stop auto-refresh
    } else {
      setRefreshInterval(30); // Resume with 30 seconds
      fetchDashboardData(); // Refresh immediately
    }
  };

  return (
    <div className='p-4 space-y-6'>
      <div className="flex justify-between items-center">
        <h1 className='text-2xl font-bold'>Admin Dashboard</h1>
        
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={fetchDashboardData}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <ArrowPathIcon 
              className={`-ml-0.5 mr-1.5 h-5 w-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} 
              aria-hidden="true" 
            />
            Refresh
          </button>
          
          <button
            type="button"
            onClick={toggleRefresh}
            className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm ${
              refreshInterval 
                ? 'bg-western-purple text-white hover:bg-purple-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {refreshInterval ? 'Auto-refresh On' : 'Auto-refresh Off'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <StatCard
          title='Total Students'
          value={stats.totalStudents}
          icon={<UserIcon className='h-6 w-6' />}
          color='border-blue-500'
        />
        <StatCard
          title='Matched Students'
          value={stats.matchedStudents}
          icon={<UserGroupIcon className='h-6 w-6' />}
          color='border-green-500'
        />
        <StatCard
          title='Pending Matches'
          value={stats.pendingMatches}
          icon={<ClockIcon className='h-6 w-6' />}
          color='border-yellow-500'
        />
        <StatCard
          title='Needing Approval'
          value={stats.needingApproval}
          icon={<ShieldCheckIcon className='h-6 w-6' />}
          color='border-red-500'
        />
      </div>

      {/* Charts */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='bg-white p-6 rounded-lg shadow-md'>
          <h2 className='text-xl font-semibold mb-4'>Matches by Status</h2>
          {loading && stats.matchesByStatus.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width='100%' height={300}>
              <BarChart data={stats.matchesByStatus}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='status' />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey='count' fill='#3b82f6' />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className='bg-white p-6 rounded-lg shadow-md'>
          <h2 className='text-xl font-semibold mb-4'>Matches by Area of Law</h2>
          {loading && stats.matchesByArea.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width='100%' height={300}>
              <BarChart data={stats.matchesByArea}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='area_of_law' />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey='count' fill='#10b981' />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
