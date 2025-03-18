import React from 'react'
import {
  UserGroupIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'

const stats = [
  { name: 'Total Students', value: '150', icon: UserGroupIcon, change: '+12%', changeType: 'increase' },
  { name: 'Organizations', value: '45', icon: BuildingOfficeIcon, change: '+8%', changeType: 'increase' },
  { name: 'Faculty Members', value: '25', icon: AcademicCapIcon, change: '+5%', changeType: 'increase' },
  { name: 'Placement Rate', value: '92%', icon: ChartBarIcon, change: '+2%', changeType: 'increase' },
]

const recentActivity = [
  {
    id: 1,
    user: 'John Doe',
    action: 'completed profile',
    target: 'Student Profile',
    date: '3 minutes ago',
  },
  {
    id: 2,
    user: 'Acme Law Firm',
    action: 'posted',
    target: '2 new positions',
    date: '1 hour ago',
  },
  {
    id: 3,
    user: 'Sarah Smith',
    action: 'graded',
    target: '5 student statements',
    date: '2 hours ago',
  },
  {
    id: 4,
    user: 'Tech Legal LLP',
    action: 'updated',
    target: 'organization profile',
    date: '3 hours ago',
  },
]

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome to the SAIL admin dashboard. Here's an overview of your system.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6"
          >
            <dt>
              <div className="absolute rounded-md bg-western-purple p-3">
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
              <p
                className={`ml-2 flex items-baseline text-sm font-semibold ${
                  item.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {item.change}
              </p>
            </dd>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Recent Activity</h3>
          <div className="mt-6 flow-root">
            <ul role="list" className="-my-5 divide-y divide-gray-200">
              {recentActivity.map((activity) => (
                <li key={activity.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{activity.user}</p>
                      <p className="truncate text-sm text-gray-500">
                        {activity.action} {activity.target}
                      </p>
                    </div>
                    <div>
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        {activity.date}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 