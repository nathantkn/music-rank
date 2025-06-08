import { Link, useLocation } from 'react-router-dom'
import '../styles/Header.css'

export default function Header() {
  const location = useLocation()

  return (
    <div className="header">
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
    </div>
  )
}