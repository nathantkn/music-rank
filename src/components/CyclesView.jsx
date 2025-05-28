import { useEffect, useState } from 'react'
import CreateForm from './CreateForm'
import '../styles/CyclesView.css'

export default function CyclesView() {
  const [cycles, setCycles] = useState([])
  const [nameInput, setNameInput] = useState('')
  const [isActiveInput, setIsActiveInput] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Fetch all cycles
  useEffect(() => {
    fetch('/api/cycles')
      .then(r => r.json())
      .then(setCycles)
      .catch(console.error)
  }, [])

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
  }

  return (
    <div className="content">
      <CreateForm
        showCreateForm={showCreateForm}
        setShowCreateForm={setShowCreateForm}
        nameInput={nameInput}
        setNameInput={setNameInput}
        isActiveInput={isActiveInput}
        setIsActiveInput={setIsActiveInput}
        createCycle={createCycle}
      />
      
      {/* Your cycles list UI here */}
      <div className="cycles-list">
        {cycles.map(cycle => (
          <div key={cycle.id} className="cycle-item">
            <span>{cycle.name} {cycle.isActive && '(Active)'}</span>
            <button onClick={() => deleteCycle(cycle.id)}>Delete</button>
          </div>
        ))}
      </div>
      
      <button onClick={() => setShowCreateForm(true)}>Create New Cycle</button>
    </div>
  )
}