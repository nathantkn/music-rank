import { useEffect, useState } from 'react'
import './App.css'
import RankTable from './components/RankTable'

// Main App Component
export default function App() {
  const [cycles, setCycles] = useState([])
  const [selectedCycle, setSelectedCycle] = useState(null)
  const [nominations, setNominations] = useState([])

  // Fetch all cycles
  useEffect(() => {
    fetch('/api/cycles')
      .then(r => r.json())
      .then(setCycles)
      .catch(console.error)
  }, [])

  // Auto-select active cycle
  useEffect(() => {
    const activeCycle = cycles.find(c => c.isActive)
    if (activeCycle && !selectedCycle) {
      setSelectedCycle(activeCycle)
    }
  }, [cycles, selectedCycle])

  // Fetch nominations when you pick a cycle
  useEffect(() => {
    if (!selectedCycle) return
    fetch(`/api/cycles/${selectedCycle.id}/nominations`)
      .then(r => r.json())
      .then(setNominations)
      .catch(console.error)
  }, [selectedCycle])

  const activeCycle = cycles.find(c => c.isActive) || selectedCycle

  return (
    <div className="content">
      {activeCycle && selectedCycle && (
        <RankTable 
          cycleId={selectedCycle.id}
          nominations={nominations}
          cycleName={selectedCycle.name}
        />
      )}
    </div>
  )
}