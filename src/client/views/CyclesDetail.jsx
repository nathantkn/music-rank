import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import RankTable from '../components/RankTable'
import { rankedOf, unrankedOf } from '../lib/nominations'
import Breadcrumb from '../components/Breadcrumb'
import '../styles/CyclesDetail.css'
import CycleStats from '../components/CycleStats'

export default function CyclesDetail() {
    const navigate = useNavigate()
    const cycleId = window.location.pathname.split('/').pop()
    const [selectedCycle, setSelectedCycle] = useState(null)
    const [activeCycle, setActiveCycle] = useState(null)
    const [nominations, setNominations] = useState([])
    const [loading, setLoading] = useState(true)
    const [isEditingName, setIsEditingName] = useState(false)
    const [editedName, setEditedName] = useState('')
    const [confirmingActive, setConfirmingActive] = useState(false)

    // Fetch cycle data when component mounts
    useEffect(() => {
        if (!cycleId) return

        setLoading(true)
        fetch(`/api/cycles`)
            .then(r => r.json())
            .then(cycles => {
                const cycle = cycles.find(c => c.id.toString() === cycleId)
                if (cycle) {
                    setSelectedCycle(cycle)
                } else {
                    console.error('Cycle not found')
                }
                // Same response tells us which cycle a promotion would demote.
                setActiveCycle(cycles.find(c => c.isActive) || null)
                setLoading(false)
            })
            .catch(err => {
                console.error('Failed to fetch cycles:', err)
                setLoading(false)
            })
    }, [cycleId])

    // Fetch nominations when cycle is loaded
    useEffect(() => {
        if (!selectedCycle) return

        fetch(`/api/cycles/${selectedCycle.id}/nominations`)
            .then(r => r.json())
            .then(setNominations)
            .catch(console.error)
    }, [selectedCycle])

    // Make cycle active
    const makeActive = async () => {
        try {
            const res = await fetch(`/api/cycles/${selectedCycle.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: selectedCycle.name,
                    isActive: true
                })
            })

            if (res.ok) {
                const updatedCycle = await res.json()
                setSelectedCycle(updatedCycle)
                setActiveCycle(updatedCycle)
                setConfirmingActive(false)
            } else {
                console.error('Failed to make cycle active')
            }
        } catch (err) {
            console.error('Error making cycle active:', err)
        }
    }

    // Handle name editing
    const startEditingName = () => {
        setEditedName(selectedCycle.name || `Cycle ${cycleId}`)
        setIsEditingName(true)
    }

    const saveNameEdit = async () => {
        if (!editedName.trim()) {
            cancelNameEdit()
            return
        }

        try {
            const res = await fetch(`/api/cycles/${selectedCycle.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editedName.trim(),
                    isActive: selectedCycle.isActive
                })
            })

            if (res.ok) {
                const updatedCycle = await res.json()
                setSelectedCycle(updatedCycle)
                setIsEditingName(false)
            } else {
                console.error('Failed to update cycle name')
                cancelNameEdit()
            }
        } catch (err) {
            console.error('Error updating cycle name:', err)
            cancelNameEdit()
        }
    }

    const cancelNameEdit = () => {
        setIsEditingName(false)
        setEditedName('')
    }

    const handleNameKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            saveNameEdit()
        } else if (e.key === 'Escape') {
            e.preventDefault()
            cancelNameEdit()
        }
    }

    if (loading) {
        return <div className="detail-state">Loading cycle…</div>
    }

    if (!selectedCycle) {
        return (
            <div className="detail-state">
                <p className="detail-state-text">That cycle doesn’t exist.</p>
                <button className="btn-ghost" onClick={() => navigate('/cycles')}>
                    Back to cycles
                </button>
            </div>
        )
    }

    const rankedCount = rankedOf(nominations).length
    const unrankedCount = unrankedOf(nominations).length

    return (
        <>
            <Breadcrumb cycleId={selectedCycle.id} cycleName={selectedCycle.name} />

            <section className="cycles-detail">
                <div className="detail-head">
                    <div>
                        <div className="detail-title-row">
                            {isEditingName ? (
                                <input
                                    type="text"
                                    value={editedName}
                                    onChange={(e) => setEditedName(e.target.value)}
                                    onKeyDown={handleNameKeyPress}
                                    onBlur={saveNameEdit}
                                    className="detail-title-input"
                                    aria-label="Cycle name"
                                    autoFocus
                                />
                            ) : (
                                <>
                                    <h1 className="detail-title">{selectedCycle.name}</h1>
                                    <button
                                        className="icon-btn"
                                        onClick={startEditingName}
                                        title="Rename cycle"
                                    >
                                        ✎
                                    </button>
                                    {selectedCycle.isActive && <span className="chip-active">Active</span>}
                                </>
                            )}
                        </div>
                        <p className="detail-counts">
                            {nominations.length} {nominations.length === 1 ? 'nomination' : 'nominations'}
                            {' · '}{rankedCount} ranked{' · '}{unrankedCount} unranked
                        </p>
                    </div>

                    <div className="detail-actions">
                        {/* The confirm takes the whole row — sharing it wraps the buttons onto a second line */}
                        {confirmingActive ? (
                            <div className="confirm-inline">
                                <span className="confirm-copy">
                                    {activeCycle
                                        ? `Make ${selectedCycle.name} active? ${activeCycle.name} stops being the active cycle.`
                                        : `Make ${selectedCycle.name} the active cycle?`}
                                </span>
                                <button className="btn-accent" onClick={makeActive}>Make active</button>
                                <button className="btn-ghost" onClick={() => setConfirmingActive(false)}>
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Editing never required promoting the cycle — only the button was hidden */}
                                <button
                                    className="btn-accent"
                                    onClick={() => navigate(`/cycles/${selectedCycle.id}/edit`)}
                                >
                                    Edit rankings
                                </button>

                                {!selectedCycle.isActive && (
                                    <button className="btn-outline" onClick={() => setConfirmingActive(true)}>
                                        Make active
                                    </button>
                                )}

                                <button className="btn-ghost" onClick={() => navigate('/cycles')}>
                                    Back to cycles
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <CycleStats
                    cycleId={selectedCycle.id}
                    nominations={nominations}
                />

                {nominations.length === 0 ? (
                    <div className="detail-empty">
                        No nominations in this cycle yet.
                        {selectedCycle.isActive && ' Add tracks from Nominate, then rank them here.'}
                    </div>
                ) : (
                    <RankTable nominations={nominations} />
                )}
            </section>
        </>
    )
}
