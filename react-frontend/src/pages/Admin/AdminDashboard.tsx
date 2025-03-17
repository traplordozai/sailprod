import * as React from 'react'
import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    matchedStudents: 0,
    pendingMatches: 0,
    needingApproval: 0,
  })

  useEffect(() => {
    // Example: load stats from your Django endpoint, e.g. /api/admin/stats/
    // This is just a placeholder. You'd set up a real endpoint in Django.
    // For demonstration, we'll set mock data after 1 second:
    const fetchStats = async () => {
      try {
        // const res = await axios.get('http://127.0.0.1:8000/api/admin/stats/')
        // setStats(res.data)
        setTimeout(() => {
          setStats({
            totalStudents: 100,
            matchedStudents: 65,
            pendingMatches: 35,
            needingApproval: 10,
          })
        }, 1000)
      } catch (err) {
        console.error(err)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-benton-sans-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded shadow p-6 flex flex-col items-center">
          <h2 className="text-xl font-benton-sans-bold mb-2">Total Students</h2>
          <p className="text-4xl">{stats.totalStudents}</p>
        </div>
        <div className="bg-white rounded shadow p-6 flex flex-col items-center">
          <h2 className="text-xl font-benton-sans-bold mb-2">Matched</h2>
          <p className="text-4xl">{stats.matchedStudents}</p>
        </div>
        <div className="bg-white rounded shadow p-6 flex flex-col items-center">
          <h2 className="text-xl font-benton-sans-bold mb-2">Pending Matches</h2>
          <p className="text-4xl">{stats.pendingMatches}</p>
        </div>
        <div className="bg-white rounded shadow p-6 flex flex-col items-center">
          <h2 className="text-xl font-benton-sans-bold mb-2">Need Approval</h2>
          <p className="text-4xl">{stats.needingApproval}</p>
        </div>
      </div>
    </div>
  )
}