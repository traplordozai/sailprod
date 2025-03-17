import React, { useEffect, useState } from 'react'
import axios from 'axios'

interface MatchingRound {
  id: string
  round_number: number
  status: string
  matched_count: number
  total_students: number
}

export default function Matching() {
  const [rounds, setRounds] = useState<MatchingRound[]>([])
  const [selectedRound, setSelectedRound] = useState<string>('')
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    // Load existing matching rounds from e.g. /api/matching-rounds/
    const loadRounds = async () => {
      try {
        const res = await axios.get<MatchingRound[]>('http://127.0.0.1:8000/api/matching-rounds/')
        setRounds(res.data)
      } catch (err) {
        console.error(err)
      }
    }
    loadRounds()
  }, [])

  const handleRunMatching = async (roundId: string) => {
    try {
      const res = await axios.post(`http://127.0.0.1:8000/api/matching-rounds/${roundId}/run_algorithm/`)
      setFeedback(JSON.stringify(res.data))
    } catch (err: any) {
      setFeedback(err.response?.data?.error || 'Error running matching algorithm.')
    }
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-benton-sans-bold mb-4">Matching Process</h1>
      <div className="bg-white rounded shadow p-4 mb-6">
        <h2 className="text-xl font-benton-sans-bold mb-2">Existing Rounds</h2>
        <ul className="space-y-2">
          {rounds.map((r) => (
            <li key={r.id} className="border border-gray-200 p-2 rounded flex justify-between items-center">
              <div>
                <p className="font-benton-sans-bold">Round #{r.round_number}</p>
                <p>Status: {r.status} — Matched: {r.matched_count}/{r.total_students}</p>
              </div>
              <button
                onClick={() => handleRunMatching(r.id)}
                className="bg-western-purple text-white px-3 py-1 rounded hover:bg-western-deep-focus"
              >
                Run
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* For creating or selecting a round */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-xl font-benton-sans-bold mb-2">Run Matching for a Round</h2>
        <input
          type="text"
          placeholder="Matching Round ID"
          value={selectedRound}
          onChange={(e) => setSelectedRound(e.target.value)}
          className="border border-gray-300 px-2 py-1 rounded mr-2"
        />
        <button
          onClick={() => handleRunMatching(selectedRound)}
          className="bg-western-purple text-white px-3 py-1 rounded hover:bg-western-deep-focus"
        >
          Run Algorithm
        </button>
        {feedback && <p className="mt-2 text-green-600 break-all">{feedback}</p>}
      </div>
    </div>
  )
}