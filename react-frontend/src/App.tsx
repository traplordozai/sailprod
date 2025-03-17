import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import StudentManagement from './pages/StudentManagement'
import MatchingProcess from './pages/MatchingProcess'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-600 text-white p-4">
        <Link className="mr-4" to="/dashboard">Dashboard</Link>
        <Link className="mr-4" to="/students">Students</Link>
        <Link className="mr-4" to="/matching">Matching</Link>
      </nav>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/students" element={<StudentManagement />} />
        <Route path="/matching" element={<MatchingProcess />} />
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </div>
  )
}