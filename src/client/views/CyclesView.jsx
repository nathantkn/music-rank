import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/CyclesView.css'
import { getArtistsString, getAlbumImage } from '../lib/nominations'

export default function CyclesView() {
  const [cycles, setCycles] = useState([])
  const [stats, setStats] = useState([])
  const [createOpen, setCreateOpen] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [creating, setCreating] = useState(false)

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

  // Get stats for a specific cycle
  const getStatsForCycle = (cycleId) => {
    return stats.find(stat => stat.cycleId === cycleId)
  }

  const currentCycle = cycles.find(cycle => cycle.isActive)
  const archive = cycles.filter(cycle => !cycle.isActive)

  const openCreate = () => {
    setDraftName(`Cycle ${cycles.length + 1}`)
    setCreateOpen(true)
  }

  const cancelCreate = () => {
    setCreateOpen(false)
    setDraftName('')
  }

  // Creation only fires on confirm — never on opening the panel.
  const confirmCreate = async () => {
    const name = draftName.trim()
    if (!name || creating) return

    setCreating(true)
    try {
      const res = await fetch('/api/cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      if (res.ok) {
        const newCycle = await res.json()
        setCycles([...cycles, newCycle])
        cancelCreate()
      } else {
        console.error('Failed to create cycle', await res.text())
      }
    } catch (err) {
      console.error('Error creating cycle:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleDraftKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      confirmCreate()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelCreate()
    }
  }

  const currentTrack = currentCycle && getStatsForCycle(currentCycle.id)?.trackOfCycle

  return (
    <section className="cycles-view">
      <div className="cycles-head">
        <div>
          <h1 className="page-title">Cycles</h1>
          <p className="page-sub">
            {cycles.length} {cycles.length === 1 ? 'cycle' : 'cycles'} run so far. One is active at a time.
          </p>
        </div>
        <button className="btn-accent cycles-create" onClick={openCreate}>
          + New cycle
        </button>
      </div>

      {createOpen && (
        <div className="create-panel">
          <h3 className="create-panel-title">Create a new cycle</h3>
          <p className="create-panel-note">
            {currentCycle
              ? `${currentCycle.name} stays active until you promote the new one from its page.`
              : 'No cycle is active right now — promote the new one from its page.'}
          </p>
          <div className="create-panel-row">
            <input
              className="create-panel-input"
              value={draftName}
              onChange={e => setDraftName(e.target.value)}
              onKeyDown={handleDraftKeyDown}
              aria-label="New cycle name"
              autoFocus
            />
            <button
              className="btn-accent"
              onClick={confirmCreate}
              disabled={creating || !draftName.trim()}
            >
              {creating ? 'Creating…' : 'Create cycle'}
            </button>
            <button className="btn-ghost" onClick={cancelCreate}>Cancel</button>
          </div>
        </div>
      )}

      {currentCycle && (
        <Link className="current-card" to={`/cycles/${currentCycle.id}`}>
          <div className="current-art art-tile">
            {getAlbumImage(currentTrack) && (
              <img
                src={getAlbumImage(currentTrack)}
                alt=""
                onError={e => { e.currentTarget.style.display = 'none' }}
              />
            )}
          </div>
          <div className="current-body">
            <div className="current-meta">
              <span className="chip-active">Active</span>
            </div>
            <h2 className="current-name">{currentCycle.name}</h2>
            {currentTrack ? (
              <>
                <div className="current-track">{currentTrack.title}</div>
                <div className="current-artist">{getArtistsString(currentTrack)}</div>
              </>
            ) : (
              <div className="current-artist">No rankings yet</div>
            )}
          </div>
          <span className="current-arrow">→</span>
        </Link>
      )}

      {archive.length > 0 && (
        <>
          <div className="archive-head">
            <h3 className="archive-label">Archive</h3>
            <span className="archive-rule" />
          </div>
          <div className="archive-grid">
            {archive.map(cycle => {
              const track = getStatsForCycle(cycle.id)?.trackOfCycle

              return (
                <Link key={cycle.id} className="archive-card" to={`/cycles/${cycle.id}`}>
                  <div className="archive-card-head">
                    <span className="archive-name">{cycle.name}</span>
                    <span className="chip-archived">Archived</span>
                  </div>
                  <div className="archive-card-body">
                    <div className="archive-art art-tile">
                      {getAlbumImage(track) && (
                        <img
                          src={getAlbumImage(track)}
                          alt=""
                          loading="lazy"
                          onError={e => { e.currentTarget.style.display = 'none' }}
                        />
                      )}
                    </div>
                    <div className="archive-track">
                      <div className="archive-title">{track?.title || 'No stats yet'}</div>
                      <div className="archive-artist">
                        {track ? getArtistsString(track) : 'Nothing computed for this cycle'}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}
