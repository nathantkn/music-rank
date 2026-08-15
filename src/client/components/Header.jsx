import { Link, useLocation } from 'react-router-dom'
import '../styles/Header.css'

const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/cycles', label: 'Cycles' },
  { to: '/nominate', label: 'Nominate' },
  { to: '/stats', label: 'Stats' },
]

// Cycles stays highlighted on the two drill-in routes (/cycles/:id and /cycles/:id/edit).
function isActive(to, pathname) {
  if (to === '/') return pathname === '/'
  return pathname === to || pathname.startsWith(`${to}/`)
}

export default function Header() {
  const { pathname } = useLocation()

  return (
    <header className="site-header">
      <Link to="/" className="site-brand">
        <span className="site-brand-dot" />
        <span className="site-brand-name">CycleBoard</span>
      </Link>
      <nav className="site-nav">
        {NAV_ITEMS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`site-nav-link ${isActive(to, pathname) ? 'active' : ''}`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
