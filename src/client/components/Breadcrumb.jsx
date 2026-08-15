import { Link } from 'react-router-dom'
import '../styles/Header.css'

/**
 * Chrome breadcrumb used by Cycle detail and Edit rankings.
 * `Cycles / Cycle 12` on detail, `Cycles / Cycle 12 / Edit rankings` on edit
 * (where the middle crumb dims and stays a link).
 */
export default function Breadcrumb({ cycleId, cycleName, deep = false }) {
  return (
    <div className="crumbs">
      <Link to="/cycles">Cycles</Link>
      <span>/</span>
      <Link to={`/cycles/${cycleId}`} className={deep ? '' : 'crumb-current'}>
        {cycleName}
      </Link>
      {deep && (
        <>
          <span>/</span>
          <span className="crumb-current">Edit rankings</span>
        </>
      )}
    </div>
  )
}
