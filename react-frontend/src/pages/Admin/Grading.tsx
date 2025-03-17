import React, { useEffect, useState } from 'react'
import axios from 'axios'

interface Statement {
  id: string
  content: string
  area_of_law: string
  statement_grade: number | null
  student_profile: string
}

export default function Grading() {
  const [statements, setStatements] = useState<Statement[]>([])
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    // Load statements from /api/statements/ to grade out of 25
    const loadStatements = async () => {
      try {
        const res = await axios.get<Statement[]>('http://127.0.0.1:8000/api/statements/')
        setStatements(res.data)
      } catch (err) {
        console.error(err)
      }
    }
    loadStatements()
  }, [])

  const handleGradeUpdate = async (id: string, grade: number) => {
    try {
      // PATCH /api/statements/{id}/ to update statement_grade
      await axios.patch(`http://127.0.0.1:8000/api/statements/${id}/`, {
        statement_grade: grade,
      })
      setFeedback(`Statement #${id} graded with ${grade}/25`)
      // re-fetch statements or update local state
      setStatements((prev) =>
        prev.map((s) => (s.id === id ? { ...s, statement_grade: grade } : s))
      )
    } catch (err: any) {
      setFeedback(err.response?.data?.error || 'Error updating grade.')
    }
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-benton-sans-bold mb-4">Grading</h1>
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-xl font-benton-sans-bold mb-2">Statements to Grade</h2>
        {statements.length === 0 ? (
          <p>No statements found.</p>
        ) : (
          <ul className="space-y-3">
            {statements.map((stmt) => (
              <li key={stmt.id} className="border border-gray-200 p-3 rounded">
                <p className="mb-1">
                  <span className="font-benton-sans-bold">Area:</span> {stmt.area_of_law}
                </p>
                <p className="mb-2">{stmt.content}</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={25}
                    defaultValue={stmt.statement_grade ?? ''}
                    onBlur={(e) => {
                      const grade = Number(e.target.value)
                      if (grade >= 0 && grade <= 25) {
                        handleGradeUpdate(stmt.id, grade)
                      }
                    }}
                    className="w-20 border border-gray-300 px-2 py-1 rounded"
                  />
                  <span>/ 25</span>
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