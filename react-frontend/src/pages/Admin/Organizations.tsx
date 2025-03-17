import React, { useEffect, useState } from 'react'
import axios from 'axios'

interface Organization {
  id: string
  name: string
  area_of_law: string
  location: string
  available_positions: number
  filled_positions: number
}

export default function Organizations() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    const loadOrgs = async () => {
      try {
        const res = await axios.get<Organization[]>('http://127.0.0.1:8000/api/organizations/')
        setOrgs(res.data)
      } catch (err) {
        console.error(err)
      }
    }
    loadOrgs()
  }, [])

  const handleOrgUpdate = async (org: Organization) => {
    try {
      // e.g. PATCH to /api/organizations/{id}/
      await axios.patch(`http://127.0.0.1:8000/api/organizations/${org.id}/`, org)
      setFeedback(`Updated organization: ${org.name}`)
    } catch (err: any) {
      setFeedback(err.response?.data?.error || 'Error updating organization.')
    }
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-benton-sans-bold mb-4">Organizations</h1>
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-xl font-benton-sans-bold mb-2">Manage Organizations</h2>
        {orgs.length === 0 ? (
          <p>No organizations found.</p>
        ) : (
          <ul className="space-y-3">
            {orgs.map((o) => (
              <li key={o.id} className="border border-gray-200 p-3 rounded">
                <div className="flex flex-col gap-1">
                  <input
                    type="text"
                    defaultValue={o.name}
                    onBlur={(e) => {
                      o.name = e.target.value
                      handleOrgUpdate(o)
                    }}
                    className="border border-gray-300 px-2 py-1 rounded"
                  />
                  <input
                    type="text"
                    defaultValue={o.area_of_law}
                    onBlur={(e) => {
                      o.area_of_law = e.target.value
                      handleOrgUpdate(o)
                    }}
                    className="border border-gray-300 px-2 py-1 rounded"
                  />
                  <input
                    type="text"
                    defaultValue={o.location}
                    onBlur={(e) => {
                      o.location = e.target.value
                      handleOrgUpdate(o)
                    }}
                    className="border border-gray-300 px-2 py-1 rounded"
                  />
                  <div className="flex gap-2">
                    <span>
                      {o.filled_positions}/{o.available_positions} Filled
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {feedback && <p className="text-green-600 mt-3">{feedback}</p>}
      </div>
    </div>
  )
}