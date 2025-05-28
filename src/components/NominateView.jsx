import { useEffect, useState } from 'react'
import '../styles/NominateView.css'

export default function NominateView() {
  const [cycles, setCycles] = useState([])
  const [selectedCycle, setSelectedCycle] = useState(null)
  const [trackIdInput, setTrackIdInput] = useState('')
  const [rankInput, setRankInput] = useState('')

  // Fetch all cycles
  useEffect(() => {
    fetch('/api/cycles')
      .then(r => r.json())
      .then(setCycles)
      .catch(console.error)
  }, [])

  // Auto-select active cycle
  useEffect(() => {
    const activeCycle = cycles.find(c => c.isActive)
    if (activeCycle && !selectedCycle) {
      setSelectedCycle(activeCycle)
    }
  }, [cycles, selectedCycle])

  // Create a nomination
  const createNomination = async () => {
    if (!selectedCycle) return alert('Select a cycle first')
    const payload = {
      cycleId: selectedCycle.id,
      spotifyTrackId: trackIdInput,
      rank: rankInput ? Number(rankInput) : null
    }
    const res = await fetch('/api/nominations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (res.ok) {
      setTrackIdInput('')
      setRankInput('')
      alert('Nomination created successfully!')
    } else {
      console.error('Failed to nominate', await res.text())
    }
  }

  return (
    <div className="content">
      <h2>Nominate a Track</h2>
      
      <div className="form-group">
        <label>Select Cycle:</label>
        <select 
          value={selectedCycle?.id || ''} 
          onChange={(e) => setSelectedCycle(cycles.find(c => c.id === parseInt(e.target.value)))}
        >
          <option value="">Choose a cycle...</option>
          {cycles.map(cycle => (
            <option key={cycle.id} value={cycle.id}>
              {cycle.name} {cycle.isActive && '(Active)'}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Spotify Track ID:</label>
        <input
          type="text"
          value={trackIdInput}
          onChange={(e) => setTrackIdInput(e.target.value)}
          placeholder="Enter Spotify track ID"
        />
      </div>

      <div className="form-group">
        <label>Rank (optional):</label>
        <input
          type="number"
          value={rankInput}
          onChange={(e) => setRankInput(e.target.value)}
          placeholder="Enter rank"
        />
      </div>

      <button onClick={createNomination} disabled={!selectedCycle || !trackIdInput}>
        Create Nomination
      </button>
    </div>
  )
}