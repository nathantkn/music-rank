import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import '../styles/EditNominations.css'
import Breadcrumb from '../components/Breadcrumb'
import { getAlbumImage, getArtistsString } from '../lib/nominations'
import { useToast } from '../components/Toast'

const LONG_PRESS_MS = 280

export default function EditNominations() {
    const navigate = useNavigate()
    const { cycleId } = useParams()
    const toast = useToast()

    const [cycle, setCycle] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // The working order — rank is always position + 1, so every move and delete
    // renumbers contiguously for free.
    const [order, setOrder] = useState([])
    const [focusIdx, setFocusIdx] = useState(null)
    const [dragIdx, setDragIdx] = useState(null)
    const [overIdx, setOverIdx] = useState(null)
    const [removeIdx, setRemoveIdx] = useState(null)
    const [bestNewArtist, setBestNewArtist] = useState('')

    const rowRefs = useRef([])
    const pendingFocus = useRef(null)
    const longPress = useRef(null)

    // Fetch cycle and nominations data
    useEffect(() => {
        if (!cycleId) return

        const fetchData = async () => {
            try {
                setLoading(true)

                // Fetch cycle info
                const cyclesRes = await fetch('/api/cycles')
                const cycles = await cyclesRes.json()
                const currentCycle = cycles.find(c => c.id.toString() === cycleId)
                setCycle(currentCycle)

                // Fetch nominations
                const nominationsRes = await fetch(`/api/cycles/${cycleId}/nominations`)
                const nominationsData = await nominationsRes.json()

                // Ranked rows first in rank order, then the unranked ones as they came back
                const ranked = nominationsData
                    .filter(nom => nom.rank != null)
                    .sort((a, b) => a.rank - b.rank)
                const unranked = nominationsData.filter(nom => nom.rank == null)
                setOrder([...ranked, ...unranked])

                // Fetch current stats to get the existing best new artist
                try {
                    const statsRes = await fetch(`/api/cycles/${cycleId}/stats`)
                    if (statsRes.ok) {
                        const statsData = await statsRes.json()
                        if (statsData?.bestNewArtist?.id != null) {
                            setBestNewArtist(String(statsData.bestNewArtist.id))
                        }
                    }
                } catch {
                    console.log('No existing stats found, starting fresh')
                }
            } catch (err) {
                console.error('Failed to fetch data:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [cycleId])

    // Focus follows a row to its new index
    useEffect(() => {
        if (pendingFocus.current == null) return
        rowRefs.current[pendingFocus.current]?.focus()
        pendingFocus.current = null
    })

    // Every distinct artist in the cycle, alphabetical
    const artists = useMemo(() => {
        const seen = new Map()
        order.forEach(nom => {
            nom.track?.artistLinks?.forEach(link => {
                if (link.artist) seen.set(link.artist.id, link.artist.name)
            })
        })
        return [...seen.entries()]
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name))
    }, [order])

    // A removed artist can't stay picked
    const pickedArtist = artists.some(a => String(a.id) === bestNewArtist) ? bestNewArtist : ''

    const move = (from, to) => {
        if (from === to || to < 0 || to >= order.length) return
        setOrder(list => {
            const next = [...list]
            const [item] = next.splice(from, 1)
            next.splice(to, 0, item)
            return next
        })
        setFocusIdx(to)
        setRemoveIdx(null)
        pendingFocus.current = to
    }

    // 2. Keyboard — ↑ / ↓ move one position, Home / End send it to the ends
    const handleListKeyDown = (e) => {
        if (focusIdx === null) return
        if (e.key === 'ArrowUp') {
            e.preventDefault()
            move(focusIdx, focusIdx - 1)
        } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            move(focusIdx, focusIdx + 1)
        } else if (e.key === 'Home') {
            e.preventDefault()
            move(focusIdx, 0)
        } else if (e.key === 'End') {
            e.preventDefault()
            move(focusIdx, order.length - 1)
        }
    }

    // 1. Mouse drag — HTML5 drag events
    const handleDragStart = (e, pos) => {
        e.dataTransfer.effectAllowed = 'move'
        setDragIdx(pos)
    }

    const handleDragOver = (e, pos) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (overIdx !== pos) setOverIdx(pos)
    }

    const handleDrop = (e, pos) => {
        e.preventDefault()
        if (dragIdx !== null && dragIdx !== pos) move(dragIdx, pos)
        setDragIdx(null)
        setOverIdx(null)
    }

    const handleDragEnd = () => {
        setDragIdx(null)
        setOverIdx(null)
    }

    // 3. Touch — long-press the handle to pick the row up, then drag
    const rowIndexAt = (clientY) => {
        const idx = rowRefs.current.findIndex(el => {
            if (!el) return false
            const rect = el.getBoundingClientRect()
            return clientY >= rect.top && clientY <= rect.bottom
        })
        return idx === -1 ? null : idx
    }

    const handlePressStart = (e, pos) => {
        if (e.pointerType === 'mouse') return // mouse uses the drag path
        e.currentTarget.setPointerCapture?.(e.pointerId)
        clearTimeout(longPress.current)
        longPress.current = setTimeout(() => {
            setDragIdx(pos)
            setOverIdx(pos)
            setFocusIdx(pos)
        }, LONG_PRESS_MS)
    }

    const handlePressMove = (e) => {
        if (dragIdx === null) return
        e.preventDefault()
        const idx = rowIndexAt(e.clientY)
        if (idx !== null && idx !== dragIdx) {
            move(dragIdx, idx)
            setDragIdx(idx)
            setOverIdx(idx)
        }
    }

    const handlePressEnd = () => {
        clearTimeout(longPress.current)
        setDragIdx(null)
        setOverIdx(null)
    }

    useEffect(() => () => clearTimeout(longPress.current), [])

    // Removal is immediate and Cancel won't bring it back — hence the inline confirm
    const removeNomination = async (pos) => {
        const nomination = order[pos]
        const title = nomination.track?.title || 'That nomination'

        try {
            const res = await fetch(`/api/nominations/${nomination.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error(await res.text())

            setOrder(list => list.filter(nom => nom.id !== nomination.id))
            setRemoveIdx(null)
            setFocusIdx(null)
            toast(`“${title}” removed from ${cycle.name}. This one saved immediately.`, 'warn')
        } catch (err) {
            console.error('Error deleting nomination:', err)
            toast('Could not remove that nomination. Please try again.', 'warn')
        }
    }

    // Order changes save here, together with the Best New Artist pick
    const handleConfirm = async () => {
        setSaving(true)

        try {
            await Promise.all(order.map((nomination, index) =>
                fetch(`/api/nominations/${nomination.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rank: index + 1 })
                })
            ))

            const statsResponse = await fetch(`/api/cycles/${cycleId}/stats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bestNewArtistId: pickedArtist ? parseInt(pickedArtist, 10) : null
                })
            })

            if (!statsResponse.ok) {
                throw new Error('Failed to update stats')
            }

            const pickedName = artists.find(a => String(a.id) === pickedArtist)?.name
            navigate(`/cycles/${cycleId}`)
            toast(pickedName
                ? `Rankings saved. Best New Artist: ${pickedName}.`
                : 'Rankings saved. No Best New Artist picked.')
        } catch (err) {
            console.error('Failed to save rankings:', err)
            toast('Could not save the rankings. Please try again.', 'warn')
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        navigate(`/cycles/${cycleId}`)
        toast('Order changes discarded. Removals stay removed.', 'warn')
    }

    if (loading) {
        return <div className="edit-state">Loading nominations…</div>
    }

    if (!cycle) {
        return (
            <div className="edit-state">
                <p>That cycle doesn’t exist.</p>
                <button className="btn-ghost" onClick={() => navigate('/cycles')}>Back to cycles</button>
            </div>
        )
    }

    if (order.length === 0) {
        return (
            <div className="edit-state">
                <p>Nothing to edit — {cycle.name} has no nominations yet.</p>
                <button className="btn-ghost" onClick={() => navigate(`/cycles/${cycleId}`)}>
                    Back to cycle
                </button>
            </div>
        )
    }

    const pickupHint = focusIdx === null
        ? 'Tip: click a row, then press ↑ or ↓ to move it. Ranks renumber as you go.'
        : `Row ${focusIdx + 1} selected — ↑ / ↓ to move it, Tab to leave.`

    return (
        <>
            <Breadcrumb cycleId={cycleId} cycleName={cycle.name} deep />

            <section className="edit-nominations">
                <div className="edit-head">
                    <div>
                        <h1 className="edit-title">Edit rankings</h1>
                        <p className="edit-help">
                            Drag a row, or focus one and use ↑ ↓. On touch, press and hold the handle.
                        </p>
                    </div>
                    <div className="edit-actions">
                        <button className="btn-accent" onClick={handleConfirm} disabled={saving}>
                            {saving ? 'Saving…' : 'Confirm rankings'}
                        </button>
                        <button className="btn-ghost" onClick={handleCancel} disabled={saving}>
                            Cancel
                        </button>
                    </div>
                </div>

                <div className="edit-notice">
                    <span className="edit-notice-tag">Unsaved</span>
                    <span className="edit-notice-copy">
                        Order changes save on Confirm. Removing a nomination happens right away and
                        Cancel won’t bring it back.
                    </span>
                </div>

                {artists.length > 0 && (
                    <div className="bna-card">
                        <div className="bna-label">Best New Artist</div>
                        <select
                            className="bna-select"
                            value={pickedArtist}
                            onChange={(e) => setBestNewArtist(e.target.value)}
                            aria-label="Best New Artist"
                        >
                            <option value="">— No pick —</option>
                            {[...artists]
                                .sort((a, b) => {
                                    if (String(a.id) === pickedArtist) return -1
                                    if (String(b.id) === pickedArtist) return 1
                                    return a.name.localeCompare(b.name)
                                })
                                .map(artist => (
                                    <option key={artist.id} value={String(artist.id)}>
                                        {artist.name}
                                    </option>
                                ))}
                        </select>
                    </div>
                )}

                <div className="rank-rows" onKeyDown={handleListKeyDown}>
                    {order.map((nomination, pos) => {
                        const selected = focusIdx === pos
                        const dragging = dragIdx === pos
                        const over = overIdx === pos && dragIdx !== pos
                        const album = nomination.track?.album?.title

                        return (
                            <div
                                key={nomination.id}
                                ref={el => { rowRefs.current[pos] = el }}
                                className={`rank-row${selected ? ' is-selected' : ''}${dragging ? ' is-dragging' : ''}${over ? ' is-over' : ''}`}
                                tabIndex={0}
                                draggable
                                onFocus={() => setFocusIdx(pos)}
                                onDragStart={(e) => handleDragStart(e, pos)}
                                onDragOver={(e) => handleDragOver(e, pos)}
                                onDrop={(e) => handleDrop(e, pos)}
                                onDragEnd={handleDragEnd}
                            >
                                <div className="rank-numeral">{pos + 1}</div>

                                <div
                                    className="rank-handle"
                                    title="Drag to reorder"
                                    onPointerDown={(e) => handlePressStart(e, pos)}
                                    onPointerMove={handlePressMove}
                                    onPointerUp={handlePressEnd}
                                    onPointerCancel={handlePressEnd}
                                >
                                    ⣿
                                </div>

                                <div className="rank-track">
                                    <div className="rank-art art-tile">
                                        {getAlbumImage(nomination.track) && (
                                            <img
                                                src={getAlbumImage(nomination.track)}
                                                alt=""
                                                loading="lazy"
                                                onError={e => { e.currentTarget.style.display = 'none' }}
                                            />
                                        )}
                                    </div>
                                    <div className="rank-text">
                                        <div className="rank-title">{nomination.track?.title}</div>
                                        <div className="rank-sub">
                                            {getArtistsString(nomination.track)}{album ? ` · ${album}` : ''}
                                        </div>
                                    </div>
                                </div>

                                <div className="rank-remove">
                                    {removeIdx === pos ? (
                                        <div className="remove-confirm">
                                            <span className="remove-copy">Remove for everyone?</span>
                                            <button className="btn-danger" onClick={() => removeNomination(pos)}>
                                                Remove
                                            </button>
                                            <button className="btn-keep" onClick={() => setRemoveIdx(null)}>
                                                Keep
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            className="remove-btn"
                                            title="Remove nomination"
                                            onClick={() => setRemoveIdx(pos)}
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                <p className="rank-hint">{pickupHint}</p>
            </section>
        </>
    )
}
