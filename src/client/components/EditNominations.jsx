import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import '../styles/EditNominations.css'

export default function EditNominations() {
    const navigate = useNavigate()
    const { cycleId } = useParams()
    const [cycle, setCycle] = useState(null)
    const [nominations, setNominations] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [draggedItem, setDraggedItem] = useState(null)
    const [dragOverIndex, setDragOverIndex] = useState(null)

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

                // Ensure all nominations have ranks
                const nominationsWithRanks = nominationsData.map((nom, index) => ({
                    ...nom,
                    rank: nom.rank || (index + 1) // Use existing rank or assign based on order
                }))

                setNominations(nominationsWithRanks)
                
            } catch (err) {
                console.error('Failed to fetch data:', err)
            } finally {
                setLoading(false)
            }
        }
        
        fetchData()
    }, [cycleId])

    // Handle drag start
    const handleDragStart = (e, index) => {
        setDraggedItem(index)
        e.dataTransfer.effectAllowed = 'move'
    }

    // Handle drag over
    const handleDragOver = (e, index) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setDragOverIndex(index)
    }

    // Handle drag leave
    const handleDragLeave = () => {
        setDragOverIndex(null)
    }

    // Handle drop
    const handleDrop = (e, dropIndex) => {
        e.preventDefault()
        
        if (draggedItem === null || draggedItem === dropIndex) {
            setDraggedItem(null)
            setDragOverIndex(null)
            return
        }

        const newNominations = [...nominations]
        
        // Move the dragged item to the drop position
        const draggedNomination = newNominations[draggedItem]
        
        // Remove the dragged item
        newNominations.splice(draggedItem, 1)
        // Insert it at the target position
        newNominations.splice(dropIndex, 0, draggedNomination)
        
        // Update ranks based on new order
        const updatedNominations = newNominations.map((nom, index) => ({
            ...nom,
            rank: index + 1
        }))
        
        setNominations(updatedNominations)
        setDraggedItem(null)
        setDragOverIndex(null)
    }

    // Save rankings to database
    const handleConfirm = async () => {
        setSaving(true)
        
        try {
            // Update each nomination's rank
            const updatePromises = nominations.map(nomination => 
                fetch(`/api/nominations/${nomination.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rank: nomination.rank })
                })
            )
            
            await Promise.all(updatePromises)
            
            // Navigate back to cycle detail
            navigate(`/cycles/${cycleId}`)
            
        } catch (err) {
            console.error('Failed to save rankings:', err)
            alert('Failed to save rankings. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    // Cancel editing
    const handleCancel = () => {
        navigate(`/cycles/${cycleId}`)
    }

    // Delete nomination
    const handleDelete = async (nominationId) => {
        if (!confirm('Are you sure you want to remove this nomination?')) {
            return
        }
        
        try {
            const response = await fetch(`/api/nominations/${nominationId}`, {
                method: 'DELETE'
            })
            
            if (response.ok) {
                // Remove from local state and update ranks
                const updatedNominations = nominations
                    .filter(nom => nom.id !== nominationId)
                    .map((nom, index) => ({
                        ...nom,
                        rank: index + 1
                    }))
                
                setNominations(updatedNominations)
            } else {
                console.error('Failed to delete nomination')
                alert('Failed to delete nomination. Please try again.')
            }
        } catch (err) {
            console.error('Error deleting nomination:', err)
            alert('Failed to delete nomination. Please try again.')
        }
    }

    if (loading) {
        return <div className="loading-state">Loading nominations...</div>
    }

    if (!cycle) {
        return (
            <div className="empty-state">
                <p>Cycle not found</p>
                <button onClick={() => navigate('/cycles')}>Back to Cycles</button>
            </div>
        )
    }

    if (!nominations || nominations.length === 0) {
        return (
            <div className="empty-state">
                <p>No nominations to edit for this cycle</p>
                <button onClick={() => navigate(`/cycles/${cycleId}`)}>Back to Cycle</button>
            </div>
        )
    }

    return (
        <div className="edit-nominations">
            <div className="edit-header">
                <div className="edit-info">
                    <h2>Edit Rankings - {cycle.name}</h2>
                    <p>Drag and drop to reorder nominations</p>
                </div>
                
                <div className="edit-actions">
                    <button 
                        className="confirm-btn"
                        onClick={handleConfirm}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Confirm Rankings'}
                    </button>
                    
                    <button 
                        className="cancel-btn"
                        onClick={handleCancel}
                        disabled={saving}
                    >
                        Cancel
                    </button>
                </div>
            </div>

            <div className="nominations-list">
                {nominations.map((nomination, index) => (
                    <div
                        key={nomination.id}
                        className={`nomination-item ${draggedItem === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                    >
                        <div className="rank-indicator">
                            <span className="rank-number">#{nomination.rank}</span>
                            <div className="drag-handle">⋮⋮</div>
                        </div>
                        
                        <div className="track-info">
                            <div className="track-title">{nomination.track.title}</div>
                            
                            <div className="track-details">
                                <span className="artists">
                                    {nomination.track.artistLinks?.map(al => al.artist.name).join(', ') || 'Unknown Artist'}
                                </span>
                                
                                {nomination.track.album && (
                                    <span className="album"> • {nomination.track.album.title}</span>
                                )}
                            </div>
                        </div>

                        <button 
                            className="delete-btn"
                            onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(nomination.id)
                            }}
                            title="Remove nomination"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}