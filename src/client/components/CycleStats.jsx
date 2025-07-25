import { useState, useEffect } from 'react'
import '../styles/CycleStats.css'

export default function CycleStats({ cycleId, isActive }) {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!cycleId) return
        
        setLoading(true)
        
        fetch(`/api/cycles/${cycleId}/stats`)
            .then(async (res) => {
                if (res.status === 404) {
                    // No stats computed yet
                    setStats(null)
                    return
                }
                if (!res.ok) {
                    throw new Error('Failed to fetch stats')
                }
                const data = await res.json()
                setStats(data)
            })
            .catch(console.error)
            .finally(() => {
                setLoading(false)
            })
    }, [cycleId])

    const computeStats = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/cycles/${cycleId}/stats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bestNewArtistId: stats?.bestNewArtist?.id || null})
            })
            
            if (res.ok) {
                // Refetch the stats after computing
                const statsRes = await fetch(`/api/cycles/${cycleId}/stats`)
                if (statsRes.ok) {
                    const data = await statsRes.json()
                    setStats(data)
                }
            } else {
                setError('Failed to compute stats')
            }
        } catch (err) {
            console.error('Error computing stats:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="cycle-stats">
                <div className="stats-loading">Computing cycle statistics...</div>
            </div>
        )
    }

    if (!stats) {
        return (
            <div className="cycle-stats">
                <div className="stats-empty">
                    <p>No stats computed for this cycle yet.</p>
                    {isActive && (
                        <button onClick={computeStats} className="compute-stats-btn">
                            Compute Stats
                        </button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="cycle-stats">            
            <div className="stats-grid">
                {/* Track of the Cycle */}
                {stats.trackOfCycle && (
                    <div className="stat-card track-of-cycle">
                        <div className="stat-header">
                            <h4>Track of the Cycle</h4>
                        </div>
                        <div className="stat-content">
                            {stats.trackOfCycle.album?.imageUrl && (
                                <img 
                                    src={stats.trackOfCycle.album.imageUrl} 
                                    alt={`${stats.trackOfCycle.title} cover`}
                                    className="track-artwork"
                                />
                            )}
                            <div className="track-info">
                                <div className="track-title">{stats.trackOfCycle.title}</div>
                                <div className="track-artist">{stats.trackOfCycle.artists}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Artist of the Cycle */}
                <div className="stat-card artist-of-cycle">
                    <div className="stat-header">
                        <h4>Artist of the Cycle</h4>
                    </div>
                    <div className="stat-content">
                        {stats.artistOfCycle ? (
                            <>
                                {stats.artistOfCycle.imageUrl && (
                                    <img 
                                        src={stats.artistOfCycle.imageUrl} 
                                        alt={`${stats.artistOfCycle.name} profile`}
                                        className="artist-photo"
                                    />
                                )}
                                <div className="artist-info">
                                    <div className="artist-name">{stats.artistOfCycle.name}</div>
                                </div>
                            </>
                        ) : (
                            <div className="stat-placeholder">
                                <div className="placeholder-icon">👤</div>
                                <div className="placeholder-text">No artist selected yet</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Best New Artist */}
                <div className="stat-card best-new-artist">
                    <div className="stat-header">
                        <h4>Best New Artist</h4>
                    </div>
                    <div className="stat-content">
                        {stats.bestNewArtist ? (
                            <>
                                {stats.bestNewArtist.imageUrl && (
                                    <img 
                                        src={stats.bestNewArtist.imageUrl} 
                                        alt={`${stats.bestNewArtist.name} profile`}
                                        className="artist-photo"
                                    />
                                )}
                                <div className="artist-info">
                                    <div className="artist-name">{stats.bestNewArtist.name}</div>
                                </div>
                            </>
                        ) : (
                            <div className="stat-placeholder">
                                <div className="placeholder-text">No best new artist was selected.</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="stats-footer">
                <div className="stats-computed">
                    Last updated: {new Date(stats.computedAt).toLocaleDateString()}
                </div>
                <button onClick={computeStats} className="recompute-stats-btn">
                    Recompute Stats
                </button>
            </div>
        </div>
    )
}