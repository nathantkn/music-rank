import '../styles/RankTable.css'

function RankTable({ nominations, deleteNomination }) {
  const sortedNominations = [...nominations].sort((a, b) => {
    if (!a.rank && !b.rank) return 0
    if (!a.rank) return 1
    if (!b.rank) return -1
    return a.rank - b.rank
  })

  return (
    <div className="billboard-container">
      <div className="billboard-header">
        <h2 className="billboard-title">Top Songs Global</h2>
        <div className="billboard-date">
          Week of May 27, 2025
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <div className="table-header-row">
            <div className="col-position">POS.</div>
            <div className="col-song">SONG</div>
            <div className="col-artist">ARTIST</div>
          </div>
        </div>

        <div className="table-body">
          {sortedNominations.length > 0 ? (
            sortedNominations.map((nomination, index) => (
              <div key={nomination.id} className="table-row">
                <div className="col-position">
                  <div className="position-badge">
                    {nomination.rank || (index + 1)}
                  </div>
                </div>
                
                <div className="col-song">
                  <div className="album-art">🎵</div>
                  <div className="song-details">
                    <div className="song-title">
                      {nomination.track?.title || nomination.trackId}
                    </div>
                    <div className="song-artist">
                      {nomination.track?.artist || 'Unknown Artist'}
                    </div>
                  </div>
                </div>
                
                <div className="col-artist">
                  {nomination.track?.artist || 'Unknown Artist'}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              No nominations yet. Add some tracks to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RankTable