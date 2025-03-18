import React, { useState } from 'react'
import {
  Cog6ToothIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BellIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'

const settings = [
  {
    id: 'general',
    name: 'General Settings',
    description: 'Basic system configuration and preferences',
    icon: Cog6ToothIcon,
    settings: [
      {
        id: 'siteName',
        name: 'Site Name',
        type: 'text',
        value: 'SAIL - Student Articling Information and Logistics',
        description: 'The name of your system that appears in the browser tab and emails',
      },
      {
        id: 'adminEmail',
        name: 'Admin Email',
        type: 'email',
        value: 'admin@uwo.ca',
        description: 'Primary contact email for system administrators',
      },
      {
        id: 'timezone',
        name: 'Timezone',
        type: 'select',
        value: 'America/Toronto',
        options: ['America/Toronto', 'America/Vancouver', 'America/Edmonton', 'America/Halifax'],
        description: 'Default timezone for the system',
      },
    ],
  },
  {
    id: 'students',
    name: 'Student Settings',
    description: 'Configuration for student-related features',
    icon: UserGroupIcon,
    settings: [
      {
        id: 'maxStatements',
        name: 'Maximum Statements',
        type: 'number',
        value: 3,
        description: 'Maximum number of statements a student can submit',
      },
      {
        id: 'statementDeadline',
        name: 'Statement Deadline',
        type: 'date',
        value: '2024-04-15',
        description: 'Deadline for student statement submissions',
      },
      {
        id: 'minGPA',
        name: 'Minimum GPA',
        type: 'number',
        value: 2.7,
        description: 'Minimum GPA required for participation',
      },
    ],
  },
  {
    id: 'organizations',
    name: 'Organization Settings',
    description: 'Configuration for organization-related features',
    icon: BuildingOfficeIcon,
    settings: [
      {
        id: 'maxPositions',
        name: 'Maximum Positions',
        type: 'number',
        value: 5,
        description: 'Maximum number of positions an organization can post',
      },
      {
        id: 'positionDeadline',
        name: 'Position Deadline',
        type: 'date',
        value: '2024-04-30',
        description: 'Deadline for organization position submissions',
      },
      {
        id: 'requireVerification',
        name: 'Require Verification',
        type: 'checkbox',
        value: true,
        description: 'Require organization verification before posting positions',
      },
    ],
  },
  {
    id: 'matching',
    name: 'Matching Settings',
    description: 'Configuration for the matching algorithm',
    icon: ChartBarIcon,
    settings: [
      {
        id: 'algorithmVersion',
        name: 'Algorithm Version',
        type: 'select',
        value: 'v2',
        options: ['v1', 'v2', 'v3'],
        description: 'Version of the matching algorithm to use',
      },
      {
        id: 'weightGPA',
        name: 'GPA Weight',
        type: 'number',
        value: 0.3,
        description: 'Weight of GPA in matching score (0-1)',
      },
      {
        id: 'weightStatement',
        name: 'Statement Weight',
        type: 'number',
        value: 0.4,
        description: 'Weight of statement grade in matching score (0-1)',
      },
      {
        id: 'weightPreferences',
        name: 'Preferences Weight',
        type: 'number',
        value: 0.3,
        description: 'Weight of preferences in matching score (0-1)',
      },
    ],
  },
  {
    id: 'notifications',
    name: 'Notification Settings',
    description: 'Configure system notifications and alerts',
    icon: BellIcon,
    settings: [
      {
        id: 'emailNotifications',
        name: 'Email Notifications',
        type: 'checkbox',
        value: true,
        description: 'Enable email notifications for system events',
      },
      {
        id: 'notifyNewSubmissions',
        name: 'New Submissions',
        type: 'checkbox',
        value: true,
        description: 'Notify admins of new statement submissions',
      },
      {
        id: 'notifyMatchingComplete',
        name: 'Matching Complete',
        type: 'checkbox',
        value: true,
        description: 'Notify when matching process is complete',
      },
    ],
  },
  {
    id: 'security',
    name: 'Security Settings',
    description: 'System security and access control settings',
    icon: ShieldCheckIcon,
    settings: [
      {
        id: 'require2FA',
        name: 'Require 2FA',
        type: 'checkbox',
        value: true,
        description: 'Require two-factor authentication for admin accounts',
      },
      {
        id: 'sessionTimeout',
        name: 'Session Timeout',
        type: 'number',
        value: 30,
        description: 'Session timeout in minutes',
      },
      {
        id: 'maxLoginAttempts',
        name: 'Max Login Attempts',
        type: 'number',
        value: 5,
        description: 'Maximum number of failed login attempts before lockout',
      },
    ],
  },
]

export default function Settings() {
  const [activeSection, setActiveSection] = useState('general')
  const [formData, setFormData] = useState({})

  const handleInputChange = (sectionId: string, settingId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [settingId]: value,
      },
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement settings save logic
    console.log('Saving settings:', formData)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure system settings and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Sidebar */}
        <div className="lg:col-span-3">
          <nav className="space-y-1">
            {settings.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeSection === section.id
                    ? 'bg-western-purple text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <section.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    activeSection === section.id ? 'text-white' : 'text-gray-400'
                  }`}
                />
                {section.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9">
          <form onSubmit={handleSubmit} className="space-y-6">
            {settings.map((section) => (
              <div
                key={section.id}
                className={`bg-white shadow sm:rounded-lg ${
                  activeSection === section.id ? 'block' : 'hidden'
                }`}
              >
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <section.icon className="h-6 w-6 text-gray-400 mr-2" />
                    <h3 className="text-lg font-medium leading-6 text-gray-900">{section.name}</h3>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{section.description}</p>

                  <div className="mt-6 space-y-6">
                    {section.settings.map((setting) => (
                      <div key={setting.id}>
                        <label htmlFor={setting.id} className="block text-sm font-medium text-gray-700">
                          {setting.name}
                        </label>
                        <div className="mt-1">
                          {setting.type === 'text' && (
                            <input
                              type="text"
                              id={setting.id}
                              defaultValue={setting.value}
                              onChange={(e) => handleInputChange(section.id, setting.id, e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-western-purple focus:ring-western-purple sm:text-sm"
                            />
                          )}
                          {setting.type === 'email' && (
                            <input
                              type="email"
                              id={setting.id}
                              defaultValue={setting.value}
                              onChange={(e) => handleInputChange(section.id, setting.id, e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-western-purple focus:ring-western-purple sm:text-sm"
                            />
                          )}
                          {setting.type === 'number' && (
                            <input
                              type="number"
                              id={setting.id}
                              defaultValue={setting.value}
                              onChange={(e) => handleInputChange(section.id, setting.id, Number(e.target.value))}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-western-purple focus:ring-western-purple sm:text-sm"
                            />
                          )}
                          {setting.type === 'date' && (
                            <input
                              type="date"
                              id={setting.id}
                              defaultValue={setting.value}
                              onChange={(e) => handleInputChange(section.id, setting.id, e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-western-purple focus:ring-western-purple sm:text-sm"
                            />
                          )}
                          {setting.type === 'select' && (
                            <select
                              id={setting.id}
                              defaultValue={setting.value}
                              onChange={(e) => handleInputChange(section.id, setting.id, e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-western-purple focus:ring-western-purple sm:text-sm"
                            >
                              {setting.options.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          )}
                          {setting.type === 'checkbox' && (
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={setting.id}
                                defaultChecked={setting.value}
                                onChange={(e) => handleInputChange(section.id, setting.id, e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-western-purple focus:ring-western-purple"
                              />
                              <label htmlFor={setting.id} className="ml-2 block text-sm text-gray-900">
                                {setting.description}
                              </label>
                            </div>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-gray-500">{setting.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                  <button
                    type="submit"
                    className="inline-flex justify-center rounded-md border border-transparent bg-western-purple py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-western-purple-dark focus:outline-none focus:ring-2 focus:ring-western-purple focus:ring-offset-2"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ))}
          </form>
        </div>
      </div>
    </div>
  )
} 