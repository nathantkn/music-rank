import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import RankTable from '../components/RankTable'
import '../styles/CyclesDetail.css'
import CycleStats from '../components/CycleStats'

export default function CyclesDetail() {
    const navigate = useNavigate()
    const cycleId = window.location.pathname.split('/').pop()
    const [selectedCycle, setSelectedCycle] = useState(null)
    const [nominations, setNominations] = useState([])
    const [loading, setLoading] = useState(true)
    const [isEditingName, setIsEditingName] = useState(false)
    const [editedName, setEditedName] = useState('')

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
        return <div className="loading-state">Loading cycle...</div>
    }

    if (!selectedCycle) {
        return (
            <div className="empty-state">
                <p>Cycle not found</p>
                <button onClick={() => navigate('/cycles')}>Back to Cycles</button>
            </div>
        )
    }

    return (
        // <>
            <div className="cycles-detail">
                <div className="cycle-header">
                    <div className="cycle-info">
                        {isEditingName ? (
                            <div className="name-edit-container">
                                <input
                                    type="text"
                                    value={editedName}
                                    onChange={(e) => setEditedName(e.target.value)}
                                    onKeyDown={handleNameKeyPress}
                                    onBlur={saveNameEdit}
                                    className="name-edit-input"
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <div className="cycle-title-container">
                                <h2>{selectedCycle.name}</h2>
                                <button 
                                    className="edit-name-btn"
                                    onClick={startEditingName}
                                    title="Edit cycle name"
                                >
                                    ✏️
                                </button>
                            </div>
                        )}
                        {selectedCycle.isActive && <span className="active-badge">ACTIVE</span>}
                    </div>
                    
                    <div className="cycle-actions">
                        {!selectedCycle.isActive && (
                            <button 
                                className="make-active-btn"
                                onClick={makeActive}
                            >
                                Make Active
                            </button>
                        )}
                        
                        {selectedCycle.isActive && (
                            <button 
                                className="edit-nominations-btn"
                                onClick={() => navigate(`/cycles/${selectedCycle.id}/edit`)}
                            >
                                Edit Nominations
                            </button>
                        )}
                        
                        <button 
                            className="back-btn"
                            onClick={() => navigate('/cycles')}
                        >
                            Back to Cycles
                        </button>
                    {/* </div> */}
                </div>
            </div>

            {!nominations || nominations.length === 0 ? (
                <div className="empty-state">
                    No nominations for this cycle yet. 
                    {selectedCycle.isActive && (
                        <span> Click "Edit Nominations" to add some tracks!</span>
                    )}
                </div>
            ) : (
                <>
                    <CycleStats cycleId={selectedCycle.id} isActive={selectedCycle.isActive} />
                    <div className="content">
                        <RankTable cycleId={selectedCycle.id} nominations={nominations} cycleName={selectedCycle.name} />
                    </div>
                </>
            )}
        </div>
    )
}