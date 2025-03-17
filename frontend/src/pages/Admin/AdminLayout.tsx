import React from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'

/**
 * A shared layout for admin pages, with a side nav reminiscent of Notion/Medium styling.
 */
export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50 text-western-black">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 shadow-lg">
        <div className="p-4 border-b border-gray-200">
          <Link to="/" className="text-2xl font-bold text-western-purple">
            My Admin
          </Link>
        </div>
        <nav className="p-4 flex flex-col gap-2">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              `px-2 py-1 rounded transition-colors ${
                isActive ? 'bg-western-purple text-white' : 'hover:bg-gray-100'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/students"
            className={({ isActive }) =>
              `px-2 py-1 rounded transition-colors ${
                isActive ? 'bg-western-purple text-white' : 'hover:bg-gray-100'
              }`
            }
          >
            Students
          </NavLink>
          <NavLink
            to="/admin/matching"
            className={({ isActive }) =>
              `px-2 py-1 rounded transition-colors ${
                isActive ? 'bg-western-purple text-white' : 'hover:bg-gray-100'
              }`
            }
          >
            Matching
          </NavLink>
          <NavLink
            to="/admin/grading"
            className={({ isActive }) =>
              `px-2 py-1 rounded transition-colors ${
                isActive ? 'bg-western-purple text-white' : 'hover:bg-gray-100'
              }`
            }
          >
            Grading
          </NavLink>
          <NavLink
            to="/admin/organizations"
            className={({ isActive }) =>
              `px-2 py-1 rounded transition-colors ${
                isActive ? 'bg-western-purple text-white' : 'hover:bg-gray-100'
              }`
            }
          >
            Organizations
          </NavLink>
          <NavLink
            to="/admin/faculty"
            className={({ isActive }) =>
              `px-2 py-1 rounded transition-colors ${
                isActive ? 'bg-western-purple text-white' : 'hover:bg-gray-100'
              }`
            }
          >
            Faculty
          </NavLink>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}