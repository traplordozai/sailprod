import React, { useEffect, useState } from 'react'
import axios from 'axios'

interface Faculty {
  id: string
  full_name: string
  department: string
  research_areas: string
  available_positions: number
  filled_positions: number
}

export default function FacultyPage() {
  const [facultyList, setFacultyList] = useState<Faculty[]>([])
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    const loadFaculty = async () => {
      try {
        const res = await axios.get<Faculty[]>('http://127.0.0.1:8000/api/faculty/')
        setFacultyList(res.data)
      } catch (err) {
        console.error(err)
      }
    }
    loadFaculty()
  }, [])

  const handleFacultyUpdate = async (f: Faculty) => {
    try {
      await axios.patch(`http://127.0.0.1:8000/api/faculty/${f.id}/`, f)
      setFeedback(`Updated faculty: ${f.full_name}`)
    } catch (err: any) {
      setFeedback(err.response?.data?.error || 'Error updating faculty.')
    }
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-benton-sans-bold mb-4">Faculty Management</h1>
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-xl font-benton-sans-bold mb-2">Manage Faculty</h2>
        {facultyList.length === 0 ? (
          <p>No faculty records found.</p>
        ) : (
          <ul className="space-y-3">
            {facultyList.map((person) => (
              <li key={person.id} className="border border-gray-200 p-3 rounded">
                <div className="flex flex-col gap-1">
                  <input
                    type="text"
                    defaultValue={person.full_name}
                    onBlur={(e) => {
                      person.full_name = e.target.value
                      handleFacultyUpdate(person)
                    }}
                    className="border border-gray-300 px-2 py-1 rounded"
                  />
                  <input
                    type="text"
                    defaultValue={person.department}
                    onBlur={(e) => {
                      person.department = e.target.value
                      handleFacultyUpdate(person)
                    }}
                    className="border border-gray-300 px-2 py-1 rounded"
                  />
                  <textarea
                    defaultValue={person.research_areas}
                    onBlur={(e) => {
                      person.research_areas = e.target.value
                      handleFacultyUpdate(person)
                    }}
                    className="border border-gray-300 px-2 py-1 rounded"
                  />
                  <span>
                    {person.filled_positions}/{person.available_positions} Positions Filled
                  </span>
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