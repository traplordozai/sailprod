import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState({});

  useEffect(() => {
    axios.get('/api/admin/dashboard/')
      .then(response => setStats(response.data))
      .catch(error => console.error('Error fetching dashboard stats:', error));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold">Total Students</h2>
          <p className="text-3xl font-bold">{stats.total_students || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold">Matched Students</h2>
          <p className="text-3xl font-bold">{stats.matched_students || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold">Pending Matches</h2>
          <p className="text-3xl font-bold">{stats.pending_matches || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold">Needs Approval</h2>
          <p className="text-3xl font-bold">{stats.needs_approval || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
