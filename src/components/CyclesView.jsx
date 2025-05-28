import '../styles/CyclesView.css'

function CyclesView({ cycles, setSelectedCycle, deleteCycle }) {
  return (
    <div className="cycles-view">
      <h2 className="section-title">Manage Cycles</h2>
      <div className="cycles-list">
        {cycles.map(cycle => (
          <div key={cycle.id} className="cycle-item">
            <div className="cycle-info">
              <div className={`status-dot ${cycle.isActive ? 'active' : ''}`}></div>
              <div className="cycle-details">
                <div className="cycle-name">{cycle.name}</div>
                <div className="cycle-status">
                  {cycle.isActive ? 'Active Cycle' : 'Inactive'}
                </div>
              </div>
            </div>
            <div className="cycle-actions">
              <button
                onClick={() => setSelectedCycle(cycle)}
                className="btn-select"
              >
                Select
              </button>
              <button
                onClick={() => deleteCycle(cycle.id)}
                className="btn-delete"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CyclesView