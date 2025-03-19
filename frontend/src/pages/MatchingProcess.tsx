/**
 * File: frontend/src/pages/MatchingProcess.tsx
 * Purpose: Page for managing the student-organization matching process
 */

import * as React from 'react'
import { useState } from 'react'
import axios from 'axios'

export default function MatchingProcess() {
  const [roundId, setRoundId] = useState('')
  const [result, setResult] = useState<string>('')

  const handleRunMatching = async () => {
    if (!roundId) return

    try {
      const res = await axios.post(`http://127.0.0.1:8000/api/matching-rounds/${roundId}/run_algorithm/`)
      setResult(JSON.stringify(res.data))
    } catch (error: any) {
      setResult(error.response?.data?.error || 'Error running matching algorithm')
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Matching Process</h1>
      <div className="bg-white p-4 shadow rounded">
        <h2 className="text-xl font-semibold mb-2">Run Matching Algorithm</h2>
        <input
          type="text"
          placeholder="Matching Round ID"
          value={roundId}
          onChange={(e) => setRoundId(e.target.value)}
          className="mr-2 border border-gray-300"
        />
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded"
          onClick={handleRunMatching}
        >
          Run
        </button>
        {result && <p className="mt-2 text-green-700 break-all">{result}</p>}
      </div>
    </div>
  )
}
