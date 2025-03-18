import * as React from 'react'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UserIcon, UserGroupIcon, ClockIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

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

// Mock data for development
const MOCK_DATA = {
  total_students: 120,
  matched_students: 85,
  pending_matches: 15,
  needs_approval: 8,
  total_organizations: 30,
  available_positions: 45,
  ungraded_statements: 12,
  matches_by_status: [
    { status: 'Pending', count: 15 },
    { status: 'Matched', count: 85 },
    { status: 'Declined', count: 5 },
    { status: 'Approved', count: 65 }
  ],
  matches_by_area: [
    { area_of_law: 'Corporate', count: 25 },
    { area_of_law: 'Criminal', count: 18 },
    { area_of_law: 'Family', count: 22 },
    { area_of_law: 'IP', count: 15 },
    { area_of_law: 'Real Estate', count: 10 }
  ]
};

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

export default function Dashboard() {
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

  useEffect(() => {
    // Simulate API call with mock data
    setTimeout(() => {
      try {
        setStats({
          totalStudents: MOCK_DATA.total_students,
          matchedStudents: MOCK_DATA.matched_students,
          pendingMatches: MOCK_DATA.pending_matches,
          needingApproval: MOCK_DATA.needs_approval,
          totalOrganizations: MOCK_DATA.total_organizations,
          availablePositions: MOCK_DATA.available_positions,
          ungradedStatements: MOCK_DATA.ungraded_statements,
          matchesByStatus: MOCK_DATA.matches_by_status,
          matchesByArea: MOCK_DATA.matches_by_area,
        });
        setLoading(false);
      } catch (err) {
        setError('Failed to load dashboard statistics');
        console.error(err);
        setLoading(false);
      }
    }, 1000); // Simulate network delay
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
        </div>

        <div className='bg-white p-6 rounded-lg shadow-md'>
          <h2 className='text-xl font-semibold mb-4'>Matches by Area of Law</h2>
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
        </div>
      </div>
    </div>
  );
}