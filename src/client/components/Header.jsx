import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import '../styles/Header.css'

export default function Header() {
  const location = useLocation()
  const [activeCycle, setActiveCycle] = useState(null)
  const [nominations, setNominations] = useState([])

  // Fetch active cycle for hero section
  useEffect(() => {
    fetch('/api/cycles')
      .then(r => r.json())
      .then(cycles => {
        const active = cycles.find(c => c.isActive)
        setActiveCycle(active)
      })
      .catch(console.error)
  }, [])

  // Fetch nominations for active cycle
  useEffect(() => {
    if (!activeCycle) return
    fetch(`/api/cycles/${activeCycle.id}/nominations`)
      .then(r => r.json())
      .then(setNominations)
      .catch(console.error)
  }, [activeCycle])

  return (
    <div className="header">
      {/* Navigation */}
      <div className="nav-container">
        <nav className="nav-buttons">
          <Link 
            to="/"
            className={`nav-button ${location.pathname === '/' ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link 
            to="/cycles"
            className={`nav-button ${location.pathname === '/cycles' ? 'active' : ''}`}
          >
            Cycles
          </Link>
          <Link 
            to="/nominate"
            className={`nav-button ${location.pathname === '/nominate' ? 'active' : ''}`}
          >
            Nominate
          </Link>
          <Link 
            to="/stats"
            className={`nav-button ${location.pathname === '/stats' ? 'active' : ''}`}
          >
            Stats
          </Link>
        </nav>
      </div>

      {/* Hero Section - Only show on home page */}
      {location.pathname === '/' && (
        <div className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              {activeCycle 
                ? `${activeCycle.name} has the most spots on Top Songs Los Angeles. "${activeCycle.name}" is the highest at #1.`
                : 'Song Cycles Ranking System'
              }
            </h1>
            <p className="hero-subtitle">
              {activeCycle 
                ? `Top Songs Los Angeles • May 16 - 22, 2025`
                : 'Select a cycle to view rankings'
              }
            </p>
          </div>
          <div className="hero-image">
            🎵
          </div>
        </div>
      )}
    </div>
  )
}