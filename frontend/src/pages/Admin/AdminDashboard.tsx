import * as React from 'react'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UserIcon, UserGroupIcon, ClockIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import apiClient from '../../services/api';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

const StatCard = ({ title, value, icon, color }: StatCardProps) => (
  <div className={`p-6 bg-white rounded-lg shadow-md flex items-center space-x-4 border-l-4 border-${color}-500`}>
    <div className={`p-3 rounded-full bg-${color}-100 text-${color}-500`}>
      {icon}
    </div>
    <div>
      <p className='text-sm font-medium text-gray-500'>{title}</p>
      <p className='text-2xl font-bold'>{value}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState({
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiClient.get('/admin/dashboard/stats/');
        setStats({
          totalStudents: res.data.total_students,
          matchedStudents: res.data.matched_students,
          pendingMatches: res.data.pending_matches,
          needingApproval: res.data.needs_approval,
          totalOrganizations: res.data.total_organizations,
          availablePositions: res.data.available_positions,
          ungradedStatements: res.data.ungraded_statements,
          matchesByStatus: res.data.matches_by_status,
          matchesByArea: res.data.matches_by_area,
        });
      } catch (err) {
        setError('Failed to load dashboard statistics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className='p-4'>Loading dashboard...</div>;
  if (error) return <div className='p-4 text-red-500'>{error}</div>;

  return (
    <div className='p-4 space-y-6'>
      <h1 className='text-2xl font-bold'>Admin Dashboard</h1>

      {/* Stat Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <StatCard
          title='Total Students'
          value={stats.totalStudents}
          icon={<UserIcon className='h-6 w-6' />}
          color='blue'
        />
        <StatCard
          title='Matched Students'
          value={stats.matchedStudents}
          icon={<UserGroupIcon className='h-6 w-6' />}
          color='green'
        />
        <StatCard
          title='Pending Matches'
          value={stats.pendingMatches}
          icon={<ClockIcon className='h-6 w-6' />}
          color='yellow'
        />
        <StatCard
          title='Needing Approval'
          value={stats.needingApproval}
          icon={<ShieldCheckIcon className='h-6 w-6' />}
          color='red'
        />
      </div>

      {/* Charts */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='bg-white p-6 rounded-lg shadow-md'>
          <h2 className='text-xl font-semibold mb-4'>Matches by Status</h2>
          <ResponsiveContainer width='100%' height={400}>
            <BarChart data={stats.matchesByStatus}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='status' />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey='count' fill='#3b82f6' />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className='bg-white p-6 rounded-lg shadow-md'>
          <h2 className='text-xl font-semibold mb-4'>Matches by Area of Law</h2>
          <ResponsiveContainer width='100%' height={400}>
            <BarChart data={stats.matchesByArea}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='area_of_law' />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey='count' fill='#10b981' />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}