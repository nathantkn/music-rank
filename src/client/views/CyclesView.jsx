import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import '../styles/CyclesView.css'
import { getArtistsString, getAlbumImage } from '../lib/nominations'
import { cyclesQuery, statsQuery } from '../lib/api'
import { invalidateAll } from '../lib/queryClient'

export default function CyclesView() {
  const [createOpen, setCreateOpen] = useState(false)
  const [draftName, setDraftName] = useState('')

  // /api/stats is the same entry the home hero reads, so arriving here from the
  // home page is a cache hit rather than a second copy of the same request.
  const { data: cycles = [] } = useQuery(cyclesQuery())
  const { data: stats = [] } = useQuery(statsQuery())

  // Get stats for a specific cycle
  const getStatsForCycle = (cycleId) => {
    return stats.find(stat => stat.cycleId === cycleId)
  }

  const currentCycle = cycles.find(cycle => cycle.isActive)
  // The list is every cycle — promoting one shouldn't make it vanish from here,
  // it just also gets featured in the card above.
  const allCycles = cycles

  const openCreate = () => {
    setDraftName(`Cycle ${cycles.length + 1}`)
    setCreateOpen(true)
  }

  const cancelCreate = () => {
    setCreateOpen(false)
    setDraftName('')
  }

  const createCycle = useMutation({
    mutationFn: async (name) => {
      const res = await fetch('/api/cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    },
    // Refetching beats splicing the new cycle in by hand — the list comes back
    // in the server's own order, and nothing can drift out of sync.
    onSuccess: () => {
      invalidateAll()
      cancelCreate()
    },
    onError: (err) => console.error('Error creating cycle:', err),
  })

  const creating = createCycle.isPending

  // Creation only fires on confirm — never on opening the panel.
  const confirmCreate = () => {
    const name = draftName.trim()
    if (!name || creating) return
    createCycle.mutate(name)
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
            {cycles.length} {cycles.length === 1 ? 'cycle' : 'cycles'} run so far.
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

      {allCycles.length > 0 && (
        <>
          <div className="archive-head">
            <h3 className="archive-label">All Cycles</h3>
            <span className="archive-rule" />
          </div>
          <div className="archive-grid">
            {allCycles.map(cycle => {
              const track = getStatsForCycle(cycle.id)?.trackOfCycle

              return (
                <Link key={cycle.id} className="archive-card" to={`/cycles/${cycle.id}`}>
                  <div className="archive-card-head">
                    <span className="archive-name">{cycle.name}</span>
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
