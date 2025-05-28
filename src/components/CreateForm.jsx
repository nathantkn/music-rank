import '../styles/CreateForm.css'

function CreateForm({ 
  showCreateForm, 
  setShowCreateForm, 
  nameInput, 
  setNameInput,
  isActiveInput,
  setIsActiveInput,
  createCycle 
}) {
  if (!showCreateForm) return null

  return (
    <div className="create-form">
      <h3 className="form-title">Create New Cycle</h3>
      <div className="form-inputs">
        <div className="input-group">
          <label className="input-label">Cycle Name</label>
          <input
            type="text"
            placeholder="Enter cycle name"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            className="text-input"
          />
        </div>
        <div className="checkbox-group">
          <input
            type="checkbox"
            id="isActive"
            checked={isActiveInput}
            onChange={e => setIsActiveInput(e.target.checked)}
            className="checkbox"
          />
          <label htmlFor="isActive" className="checkbox-label">Set as active</label>
        </div>
        <button onClick={createCycle} className="btn-primary">
          Create Cycle
        </button>
        <button onClick={() => setShowCreateForm(false)} className="btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  )
}

export default CreateForm