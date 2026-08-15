import { useState, useEffect } from 'react'
import '../styles/CycleStats.css'
import { getArtistsString, getAlbumImage } from '../lib/nominations'

// "9 Aug 2026, 21:14"
function formatComputedAt(value) {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

// "6 nominations, best at #4" — derived from the cycle's nominations, no extra fetch.
function artistSubline(artist, nominations) {
    const mine = nominations.filter(nom =>
        nom.track?.artistLinks?.some(link => link.artist.id === artist.id)
    )
    const count = `${mine.length} ${mine.length === 1 ? 'nomination' : 'nominations'}`
    const best = mine
        .filter(nom => nom.rank != null)
        .sort((a, b) => a.rank - b.rank)[0]
    return best ? `${count}, best at #${best.rank}` : count
}

function AwardCard({ label, image, name, sub }) {
    return (
        <article className="award-card">
            <div className="award-label">{label}</div>
            <div className="award-body">
                <div className="award-art art-tile">
                    {image && (
                        <img
                            src={image}
                            alt=""
                            onError={e => { e.currentTarget.style.display = 'none' }}
                        />
                    )}
                </div>
                <div className="award-text">
                    {name ? (
                        <>
                            <div className="award-name">{name}</div>
                            <div className="award-sub">{sub}</div>
                        </>
                    ) : (
                        <div className="award-unset">Not set</div>
                    )}
                </div>
            </div>
        </article>
    )
}

export default function CycleStats({ cycleId, isActive, nominations = [] }) {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

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
            setError(null)
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
            <div className="awards-strip">
                <span className="awards-computed">Computing cycle statistics…</span>
            </div>
        )
    }

    // No snapshot at all — the strip becomes the empty state.
    if (!stats) {
        return (
            <div className="awards-strip">
                <span className="awards-computed">
                    {error || 'No awards computed for this cycle yet.'}
                </span>
                {isActive && (
                    <button className="btn-outline" onClick={computeStats}>
                        Compute stats
                    </button>
                )}
            </div>
        )
    }

    const computedAt = formatComputedAt(stats.computedAt)

    return (
        <div className="awards">
            <div className="awards-grid">
                <AwardCard
                    label="Track of the Cycle"
                    image={getAlbumImage(stats.trackOfCycle)}
                    name={stats.trackOfCycle?.title}
                    sub={stats.trackOfCycle && getArtistsString(stats.trackOfCycle)}
                />
                <AwardCard
                    label="Artist of the Cycle"
                    image={stats.artistOfCycle?.imageUrl}
                    name={stats.artistOfCycle?.name}
                    sub={stats.artistOfCycle && artistSubline(stats.artistOfCycle, nominations)}
                />
                <AwardCard
                    label="Best New Artist"
                    image={stats.bestNewArtist?.imageUrl}
                    name={stats.bestNewArtist?.name}
                    sub="picked by hand"
                />
            </div>

            <div className="awards-strip">
                <span className="awards-computed">
                    {error || (computedAt ? `Awards computed ${computedAt}` : 'Awards computed')}
                </span>
                <button className="btn-outline" onClick={computeStats}>
                    Recompute
                </button>
            </div>
        </div>
    )
}
