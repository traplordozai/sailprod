import * as React from 'react'

export default function Dashboard() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      {/* In a real app, fetch stats from Django, e.g. total students, matched, etc. */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 shadow rounded">Total Students: 0</div>
        <div className="bg-white p-4 shadow rounded">Matched Students: 0</div>
        <div className="bg-white p-4 shadow rounded">Pending Matches: 0</div>
      </div>
    </div>
  )
}