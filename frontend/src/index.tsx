import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import './index.css'  // Tailwind or other global styles

// Landing/Login page
import LandingAndLogin from './pages/LandingAndLogin'

// Admin layout & pages
import AdminLayout from './pages/Admin/AdminLayout'
import AdminDashboard from './pages/Admin/AdminDashboard'
import AdminStudents from './pages/Admin/Students'
import AdminMatching from './pages/Admin/Matching'
import AdminGrading from './pages/Admin/Grading'
import AdminOrganizations from './pages/Admin/Organizations'
import AdminFaculty from './pages/Admin/Faculty'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1) Main / landing page */}
        <Route path="/" element={<LandingAndLogin />} />

        {/* 2) Admin routes (wrapped in AdminLayout) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="matching" element={<AdminMatching />} />
          <Route path="grading" element={<AdminGrading />} />
          <Route path="organizations" element={<AdminOrganizations />} />
          <Route path="faculty" element={<AdminFaculty />} />
        </Route>

        {/* 3) Catch-all route for unrecognized URLs */}
        <Route path="*" element={<div className="p-6">Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  )
}

// Attach to #root in your public/index.html
const container = document.getElementById('root') as HTMLElement
const root = ReactDOM.createRoot(container)
root.render(<App />)