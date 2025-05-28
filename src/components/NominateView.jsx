import '../styles/NominateView.css'

function NominateView({ 
  selectedCycle, 
  trackIdInput, 
  setTrackIdInput,
  rankInput,
  setRankInput,
  createNomination 
}) {
  return (
    <div className="nominate-view">
      <h2 className="section-title">Add Nomination</h2>
      {selectedCycle ? (
        <div className="nominate-form">
          <div className="selected-cycle">
            Adding to: <strong>{selectedCycle.name}</strong>
          </div>
          <div className="form-fields">
            <div className="field">
              <label className="field-label">Spotify Track ID</label>
              <input
                type="text"
                placeholder="Enter Spotify Track ID"
                value={trackIdInput}
                onChange={e => setTrackIdInput(e.target.value)}
                className="field-input"
              />
            </div>
            <div className="field">
              <label className="field-label">Rank (optional)</label>
              <input
                type="number"
                placeholder="1-10 or leave blank for HM"
                value={rankInput}
                onChange={e => setRankInput(e.target.value)}
                className="field-input"
                min="1"
                max="100"
              />
            </div>
            <button onClick={createNomination} className="btn-nominate">
              Add Nomination
            </button>
          </div>
        </div>
      ) : (
        <div className="no-cycle">Please select a cycle first to add nominations.</div>
      )}
    </div>
  )
}

export default NominateView