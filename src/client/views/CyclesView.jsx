import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/CyclesView.css'
import {
  applyUniquePresetGradients
} from '../utils/gradientUtils'
import { applyHardcodedGradientPresets } from '../utils/hardcodedGradientUtils'

export default function CyclesView() {
  const [cycles, setCycles] = useState([])
  const [stats, setStats] = useState([])
  const cyclesGridRef = useRef(null);
  const navigate = useNavigate()

  // Fetch all cycles and stats
  useEffect(() => {
    // Fetch cycles
    fetch('/api/cycles')
      .then(r => r.json())
      .then(setCycles)
      .catch(console.error)
    
    // Fetch stats
    fetch(`/api/stats`)
      .then(async (res) => {
          if (res.status === 404) {
            // No stats computed yet
            setStats([])
            return
          }
          if (!res.ok) {
            throw new Error('Failed to fetch stats')
          }
          const data = await res.json()
          setStats(data)
      })
      .catch(console.error)
  }, [])

  // Create a new cycle
  const createCycle = async () => {
    const res = await fetch('/api/cycles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `Cycle ${cycles.length + 1}` })
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

  // Get stats for a specific cycle
  const getStatsForCycle = (cycleId) => {
    return stats.find(stat => stat.cycleId === cycleId)
  }

  // Helper function to get all artists from artistLinks
  const getArtistsString = (track) => {
    if (track?.artistLinks && track.artistLinks.length > 0) {
      return track.artistLinks.map(link => link.artist.name).join(', ')
    }
    return track?.artist || ''
  }

  // useEffect(() => {
  //   if (cyclesGridRef.current && cycles.length > 0) {
  //     const cards = cyclesGridRef.current.querySelectorAll('.cycle-card:not(.add-cycle-card)');
  //     applyUniquePresetGradients(cards);
  //   }
  // }, [cycles]);

  // Get the active cycle
  const currentCycle = cycles.find(cycle => cycle.isActive)
  const otherCycles = cycles.filter(cycle => !cycle.isActive)

  return (
    <div className="cycles-view">
      <h1 className="section-title">Cycles</h1>
      
      {/* Current Cycle Section */}
      {currentCycle && (
        <div className="current-cycle-section">
          <h2 className="current-cycle-label">Current Cycle</h2>
          <div 
            className="current-cycle-card"
            onClick={() => handleCycleClick(currentCycle.id)}
          >
            <div className="current-cycle-content">
              <div className="current-album-art">
                {getStatsForCycle(currentCycle.id)?.trackOfCycle?.album?.imageUrl ? (
                  <img 
                    src={getStatsForCycle(currentCycle.id).trackOfCycle.album.imageUrl} 
                    alt={`${getStatsForCycle(currentCycle.id).trackOfCycle.album.title} cover`}
                    className="current-album-image"
                  />
                ) : (
                  <div className="current-album-placeholder">♪</div>
                )}
              </div>
              <div className="current-cycle-info">
                <h3 className="current-cycle-title">{currentCycle.name}</h3>
                <div className="current-song-info">
                  <div className="current-song-title">
                    {getStatsForCycle(currentCycle.id)?.trackOfCycle?.title || 'No rankings yet'}
                  </div>
                  <div className="current-artist-names">
                    {getArtistsString(getStatsForCycle(currentCycle.id)?.trackOfCycle)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Create Cycle */}
      <div className="quick-create-section">
        <div className="quick-create-card" onClick={() => createCycle()}>
          <div className="quick-create-icon">+</div>
          <div className="quick-create-text">Create New Cycle</div>
        </div>
      </div>

      {/* All Cycles Grid */}
      <h2 className="all-cycles-label">All Cycles</h2>
      <div className="cycles-grid" ref={cyclesGridRef}>
        {otherCycles.map(cycle => {
          const cycleStats = getStatsForCycle(cycle.id)
          const trackOfCycle = cycleStats?.trackOfCycle

          return (
            <div 
              key={cycle.id} 
              className={`cycle-card ${cycle.isActive ? 'active' : ''}`}
              onClick={() => handleCycleClick(cycle.id)}
            >
              <div className="cycle-header">
                <h2 className="cycle-title">{cycle.name}</h2>
                {cycle.isActive && <span className="active-badge">ACTIVE</span>}
              </div>

              <div className="cycle-content">
                <div className="album-art">
                  {trackOfCycle?.album?.imageUrl ? (
                    <img 
                      src={trackOfCycle.album.imageUrl} 
                      alt={`${trackOfCycle.album.title} cover`}
                      className="album-image"
                    />
                  ) : (
                    <div className="album-placeholder">♪</div>
                  )}
                </div>
              </div>

              <div className="cycle-footer">
                <div className="number-one-info">
                  <div className="song-info">
                    <div className="song-title">
                      {trackOfCycle?.title || ''}
                    </div>
                    <div className="artist-names">
                      {getArtistsString(trackOfCycle)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        
        <div className="add-cycle-card" onClick={() => createCycle()}>
          <div className="add-icon">+</div>
          <div className="add-text">Create New Cycle</div>
        </div>
      </div>
    </div>
  )
}