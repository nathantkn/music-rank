import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import '../styles/CycleStats.css'
import { getAlbumImage } from '../lib/nominations'
import { highlightsQuery } from '../lib/api'
import { invalidateAll } from '../lib/queryClient'

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

// "3rd win" — 1st/2nd/3rd, then th, with the 11th–13th exception.
function ordinal(n) {
    const teens = n % 100
    if (teens >= 11 && teens <= 13) return `${n}th`
    switch (n % 10) {
        case 1: return `${n}st`
        case 2: return `${n}nd`
        case 3: return `${n}rd`
        default: return `${n}th`
    }
}

// "Out of 4 new artists" — the field the pick was made from, counted the same
// way the home hero's New Blood card counts it: artists on this cycle with no
// nomination in any earlier one.
function debutSubline(artist, debuts) {
    // A cycle can have a hand-picked winner and no debuts at all — the picker
    // offers every artist on the chart, not just the new ones. Say nothing
    // rather than "out of 0".
    if (!artist || !debuts?.count) return null
    return `Out of ${debuts.count} new ${debuts.count === 1 ? 'artist' : 'artists'}`
}

// `variant` carries the award's accent and border via custom properties — see
// CycleStats.css. The art fills the card, so a winner with no image falls back
// to the bare panel rather than a gap.
function AwardCard({ variant, label, image, name, sub }) {
    return (
        <article className={`award-card ${variant}`}>
            {image && (
                <>
                    <div
                        className="award-art"
                        style={{ backgroundImage: `url("${image}")` }}
                    />
                    <div className="award-scrim" />
                </>
            )}
            <div className="award-content">
                <div className="award-label">{label}</div>
                {name ? (
                    <>
                        <div className="award-name">{name}</div>
                        {sub && <div className="award-sub">{sub}</div>}
                    </>
                ) : (
                    <div className="award-unset">Not set</div>
                )}
            </div>
        </article>
    )
}

export default function CycleStats({ cycleId }) {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Shares a cache entry with the home hero, which asks for the same
    // highlights when this cycle is the one it features.
    const { data: highlights } = useQuery(highlightsQuery(cycleId))

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
                // A fresh snapshot changes the hero cards and the archive grid.
                invalidateAll()
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
                <button className="btn-outline" onClick={computeStats}>
                    Compute stats
                </button>
            </div>
        )
    }

    const computedAt = formatComputedAt(stats.computedAt)

    return (
        <div className="awards">
            <div className="awards-grid">
                <AwardCard
                    variant="award-track"
                    label="Track of the Cycle"
                    image={getAlbumImage(stats.trackOfCycle)}
                    name={stats.trackOfCycle?.title}
                    sub={stats.trackOfCycle?.album?.title}
                />
                <AwardCard
                    variant="award-artist"
                    label="Artist of the Cycle"
                    image={stats.artistOfCycle?.imageUrl}
                    name={stats.artistOfCycle?.name}
                    sub={stats.artistOfCycle?.winNumber
                        ? `${ordinal(stats.artistOfCycle.winNumber)} win`
                        : null}
                />
                <AwardCard
                    variant="award-debut"
                    label="Best New Artist"
                    image={stats.bestNewArtist?.imageUrl}
                    name={stats.bestNewArtist?.name}
                    sub={debutSubline(stats.bestNewArtist, highlights?.debuts)}
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
