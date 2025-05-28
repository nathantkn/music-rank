import '../styles/Header.css'

function Header({ activeCycle, nominations, activeView, setActiveView, showCreateForm, setShowCreateForm }) {
  return (
    <div className="header">
      {/* Navigation */}
      <div className="nav-container">
        <nav className="nav-buttons">
          <button 
            onClick={() => setActiveView('rankings')}
            className={`nav-button ${activeView === 'rankings' ? 'active' : ''}`}
          >
            Home
          </button>
          <button 
            onClick={() => setActiveView('cycles')}
            className={`nav-button ${activeView === 'cycles' ? 'active' : ''}`}
          >
            Cycles
          </button>
          <button 
            onClick={() => setActiveView('nominate')}
            className={`nav-button ${activeView === 'nominate' ? 'active' : ''}`}
          >
            Nominate
          </button>
          <button 
            onClick={() => setShowCreateForm(true)}
            className={`nav-button ${showCreateForm ? 'active' : ''}`}
          >
            Stats
          </button>
        </nav>
      </div>

      {/* Hero Section */}
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
    </div>
  )
}

export default Header