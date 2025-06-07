import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/CyclesView.css'

export default function CyclesView() {
  const [cycles, setCycles] = useState([])
  const navigate = useNavigate()

  // Fetch all cycles
  useEffect(() => {
    fetch('/api/cycles')
      .then(r => r.json())
      .then(setCycles)
      .catch(console.error)
  }, [])

  // Create a new cycle
  const createCycle = async () => {
    const res = await fetch('/api/cycles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    if (res.ok) {
      const newCycle = await res.json()
      setCycles([...cycles, newCycle])
    } else {
      console.error('Failed to create cycle', await res.text())
    }
  }

  // Navigate to cycle chart
  const handleCycleClick = (cycleId) => {
    navigate(`/cycles/${cycleId}`)
  }

  return (
    <div className="cycles-view">
      <h1 className="section-title">Cycles</h1>
      
      <div className="cycles-grid">
        {cycles.map(cycle => (
          <div 
            key={cycle.id} 
            className={`cycle-card ${cycle.isActive ? 'active' : ''}`}
            onClick={() => handleCycleClick(cycle.id)}
          >
            <div className="cycle-header">
              <h2 className="cycle-title">{cycle.name || `Cycle ${cycle.id}`}</h2>
              {cycle.isActive && <span className="active-badge">ACTIVE</span>}
            </div>
            
            <div className="cycle-content">
              {/* Placeholder for album art - you can replace with actual image */}
              <div className="album-art">
                <div className="album-placeholder">♪</div>
              </div>
            </div>
            
            <div className="cycle-footer">
              <div className="number-one-info">
                <span className="position-badge">#1 THIS CYCLE</span>   
                <div className="song-info">
                  <div className="song-title">{cycle.topSong?.title || 'No data yet'}</div>
                  <div className="artist-name">{cycle.topSong?.artist || ''}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <div className="add-cycle-card" onClick={() => createCycle()}>
          <div className="add-icon">+</div>
          <div className="add-text">Create New Cycle</div>
        </div>
      </div>
    </div>
  )
}