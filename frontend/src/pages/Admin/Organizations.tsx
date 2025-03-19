/**
 * File: frontend/src/pages/Admin/Organizations.tsx
 * Purpose: Organization management dashboard for administrators
 */

import React, { useEffect, useState } from 'react'
import { fetchOrganizations, updateOrganization, createOrganization, deleteOrganization, Organization } from '../../services/organizationService'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import CsvImport from '../../components/CsvImport'

export default function Organizations() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [csvImportMessage, setCsvImportMessage] = useState('')
  const [newOrg, setNewOrg] = useState<Partial<Organization>>({
    name: '',
    area_of_law: '',
    location: '',
    available_positions: 0,
    filled_positions: 0,
  })

  const loadOrgs = async () => {
    setLoading(true)
    try {
      const data = await fetchOrganizations()
      setOrgs(data)
      setError('')
    } catch (err) {
      console.error(err)
      setError('Failed to load organizations. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrgs()
  }, [])

  const handleOrgUpdate = async (id: string, field: string, value: string | number) => {
    try {
      setFeedback('Saving...')
      const orgToUpdate = orgs.find(o => o.id === id)
      if (!orgToUpdate) return

      const updatedOrg = { ...orgToUpdate, [field]: value }
      await updateOrganization(id, { [field]: value })
      
      // Update local state
      setOrgs(orgs.map(o => o.id === id ? updatedOrg : o))
      setFeedback(`Updated organization: ${updatedOrg.name}`)
      
      // Clear feedback after 3 seconds
      setTimeout(() => setFeedback(''), 3000)
    } catch (err: any) {
      setFeedback(err.response?.data?.error || 'Error updating organization.')
    }
  }

  const handleNewOrgChange = (field: string, value: string | number) => {
    setNewOrg({
      ...newOrg,
      [field]: value
    })
  }

  const handleAddOrg = async () => {
    try {
      setLoading(true)
      // Make sure required fields are present
      if (!newOrg.name || !newOrg.area_of_law || !newOrg.location) {
        setFeedback('Please fill in all required fields')
        return
      }

      const createdOrg = await createOrganization(newOrg)
      setOrgs([...orgs, createdOrg])
      setFeedback(`Added new organization: ${createdOrg.name}`)
      
      // Reset the form
      setNewOrg({
        name: '',
        area_of_law: '',
        location: '',
        available_positions: 0,
        filled_positions: 0,
      })
      
      // Clear feedback after 3 seconds
      setTimeout(() => setFeedback(''), 3000)
    } catch (err: any) {
      setFeedback(err.response?.data?.error || 'Error adding organization.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOrg = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this organization?')) {
      return
    }
    
    try {
      setLoading(true)
      await deleteOrganization(id)
      
      // Update local state
      setOrgs(orgs.filter(o => o.id !== id))
      setFeedback('Organization deleted successfully')
      
      // Clear feedback after 3 seconds
      setTimeout(() => setFeedback(''), 3000)
    } catch (err: any) {
      setFeedback(err.response?.data?.error || 'Error deleting organization.')
    } finally {
      setLoading(false)
    }
  }

  // Handle CSV import success
  const handleImportSuccess = async () => {
    setCsvImportMessage('Organizations imported successfully!');
    // Clear message after 3 seconds
    setTimeout(() => setCsvImportMessage(''), 3000);
    // Refresh organizations list
    await loadOrgs();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Organizations</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage and view all organizations in the system.
        </p>
      </div>

      {/* CSV Import */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Import Organizations</h3>
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700">Import Organizations CSV</label>
            <CsvImport 
              endpoint="/organizations/import_csv/" 
              onSuccess={handleImportSuccess}
              title="Import Organizations"
            />
            {csvImportMessage && (
              <p className={`mt-2 text-sm ${csvImportMessage.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                {csvImportMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Add New Organization */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Add New Organization</h3>
          <div className="mt-2 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name *
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="name"
                  value={newOrg.name}
                  onChange={(e) => handleNewOrgChange('name', e.target.value)}
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="area_of_law" className="block text-sm font-medium text-gray-700">
                Area of Law *
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="area_of_law"
                  value={newOrg.area_of_law}
                  onChange={(e) => handleNewOrgChange('area_of_law', e.target.value)}
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location *
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="location"
                  value={newOrg.location}
                  onChange={(e) => handleNewOrgChange('location', e.target.value)}
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="available_positions" className="block text-sm font-medium text-gray-700">
                Available Positions
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  id="available_positions"
                  value={newOrg.available_positions}
                  onChange={(e) => handleNewOrgChange('available_positions', parseInt(e.target.value) || 0)}
                  min="0"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="filled_positions" className="block text-sm font-medium text-gray-700">
                Filled Positions
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  id="filled_positions"
                  value={newOrg.filled_positions}
                  onChange={(e) => handleNewOrgChange('filled_positions', parseInt(e.target.value) || 0)}
                  min="0"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-5">
            <button
              type="button"
              onClick={handleAddOrg}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Organization
            </button>
          </div>
        </div>
      </div>

      {/* Organization List */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Manage Organizations</h3>
          
          {error && (
            <div className="my-3 bg-red-50 p-4 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          {loading && <p className="text-gray-500">Loading...</p>}
          
          {!loading && orgs.length === 0 ? (
            <p className="text-gray-500 mt-3">No organizations found.</p>
          ) : (
            <div className="mt-6 flow-root">
              <ul className="divide-y divide-gray-200">
                {orgs.map((org) => (
                  <li key={org.id} className="py-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-500">Name</label>
                        <input
                          type="text"
                          defaultValue={org.name}
                          onBlur={(e) => handleOrgUpdate(org.id, 'name', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                        />
                      </div>
                      
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-500">Area of Law</label>
                        <input
                          type="text"
                          defaultValue={org.area_of_law}
                          onBlur={(e) => handleOrgUpdate(org.id, 'area_of_law', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                        />
                      </div>
                      
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-500">Location</label>
                        <input
                          type="text"
                          defaultValue={org.location}
                          onBlur={(e) => handleOrgUpdate(org.id, 'location', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                        />
                      </div>
                      
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-500">Available Positions</label>
                        <input
                          type="number"
                          defaultValue={org.available_positions}
                          onBlur={(e) => handleOrgUpdate(org.id, 'available_positions', parseInt(e.target.value) || 0)}
                          min="0"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                        />
                      </div>
                      
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-500">Filled Positions</label>
                        <input
                          type="number"
                          defaultValue={org.filled_positions}
                          onBlur={(e) => handleOrgUpdate(org.id, 'filled_positions', parseInt(e.target.value) || 0)}
                          min="0"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                        />
                      </div>
                      
                      <div className="sm:col-span-2 flex items-end">
                        <button
                          type="button"
                          onClick={() => handleDeleteOrg(org.id)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {feedback && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-700">{feedback}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
