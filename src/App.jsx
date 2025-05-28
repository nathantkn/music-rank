import { useEffect, useState } from 'react'
import './App.css'
import Header from './components/Header'
import RankTable from './components/RankTable'
import CreateForm from './components/CreateForm'
import CyclesView from './components/CyclesView'
import NominateView from './components/NominateView'

// Main App Component
export default function App() {
  const [cycles, setCycles] = useState([])
  const [nameInput, setNameInput] = useState('')
  const [isActiveInput, setIsActiveInput] = useState(false)
  const [selectedCycle, setSelectedCycle] = useState(null)
  const [nominations, setNominations] = useState([])
  const [trackIdInput, setTrackIdInput] = useState('')
  const [rankInput, setRankInput] = useState('')
  const [activeView, setActiveView] = useState('rankings')
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Fetch all cycles
  useEffect(() => {
    fetch('/api/cycles')
      .then(r => r.json())
      .then(setCycles)
      .catch(console.error)
  }, [])

  // Fetch nominations when you pick a cycle
  useEffect(() => {
    if (!selectedCycle) return
    fetch(`/api/cycles/${selectedCycle.id}/nominations`)
      .then(r => r.json())
      .then(setNominations)
      .catch(console.error)
  }, [selectedCycle])

  // Auto-select active cycle
  useEffect(() => {
    const activeCycle = cycles.find(c => c.isActive)
    if (activeCycle && !selectedCycle) {
      setSelectedCycle(activeCycle)
    }
  }, [cycles, selectedCycle])

  // Create a new cycle
  const createCycle = async () => {
    const res = await fetch('/api/cycles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameInput, isActive: isActiveInput })
    })
    if (res.ok) {
      const newCycle = await res.json()
      setCycles([...cycles, newCycle])
      setNameInput('')
      setIsActiveInput(false)
      setShowCreateForm(false)
    } else {
      console.error('Failed to create cycle', await res.text())
    }
  }

  // Delete a cycle
  const deleteCycle = async (id) => {
    await fetch(`/api/cycles/${id}`, { method: 'DELETE' })
    setCycles(cycles.filter(c => c.id !== id))
    if (selectedCycle?.id === id) setSelectedCycle(null)
  }

  // Create a nomination
  const createNomination = async () => {
    if (!selectedCycle) return alert('Select a cycle first')
    const payload = {
      cycleId: selectedCycle.id,
      spotifyTrackId: trackIdInput,
      rank: rankInput ? Number(rankInput) : null
    }
    const res = await fetch('/api/nominations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (res.ok) {
      const nom = await res.json()
      setNominations([...nominations, nom])
      setTrackIdInput('')
      setRankInput('')
    } else {
      console.error('Failed to nominate', await res.text())
    }
  }

  // Delete a nomination
  const deleteNomination = async (id) => {
    await fetch(`/api/nominations/${id}`, { method: 'DELETE' })
    setNominations(nominations.filter(n => n.id !== id))
  }

  const activeCycle = cycles.find(c => c.isActive) || selectedCycle

  return (
    <div className="app">
      <Header 
        activeCycle={activeCycle}
        nominations={nominations}
        activeView={activeView}
        setActiveView={setActiveView}
        showCreateForm={showCreateForm}
        setShowCreateForm={setShowCreateForm}
      />

      {/* Content Section */}
      <div className="content">
        {/* Create Form Modal */}
        <CreateForm
          showCreateForm={showCreateForm}
          setShowCreateForm={setShowCreateForm}
          nameInput={nameInput}
          setNameInput={setNameInput}
          isActiveInput={isActiveInput}
          setIsActiveInput={setIsActiveInput}
          createCycle={createCycle}
        />

        {activeView === 'rankings' && activeCycle && (
          <RankTable 
            nominations={nominations}
            deleteNomination={deleteNomination}
          />
        )}

        {activeView === 'cycles' && (
          <CyclesView
            cycles={cycles}
            setSelectedCycle={setSelectedCycle}
            deleteCycle={deleteCycle}
          />
        )}

        {activeView === 'nominate' && (
          <NominateView
            selectedCycle={selectedCycle}
            trackIdInput={trackIdInput}
            setTrackIdInput={setTrackIdInput}
            rankInput={rankInput}
            setRankInput={setRankInput}
            createNomination={createNomination}
          />
        )}
      </div>
    </div>
  )
}