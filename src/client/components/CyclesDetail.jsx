import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import RankTable from './RankTable'
import '../styles/CyclesDetail.css'

export default function CyclesDetail() {
    const navigate = useNavigate()
    const cycleId = window.location.pathname.split('/').pop()
    const [selectedCycle, setSelectedCycle] = useState(null)
    const [nominations, setNominations] = useState([])
    const [loading, setLoading] = useState(true)

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
        <div className="cycles-detail">
            <div className="cycle-header">
                <div className="cycle-info">
                    <h2>{selectedCycle.name} - Nominations</h2>
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
                <RankTable nominations={nominations} cycleName={selectedCycle.name} />
            )}
        </div>
    )
}