import '../styles/RankTable.css'

function RankTable({ nominations, cycleName = 'Current Cycle' }) {
  const sortedNominations = [...nominations].sort((a, b) => {
    if (!a.rank && !b.rank) return 0
    if (!a.rank) return 1
    if (!b.rank) return -1
    return a.rank - b.rank
  })

  // Helper function to get all artists from artistLinks
  const getArtistsString = (track) => {
    if (track?.artistLinks && track.artistLinks.length > 0) {
      return track.artistLinks.map(link => link.artist.name).join(', ')
    }
    return track?.artist || 'Unknown Artist'
  }

  // Helper function to get album cover image
  const getAlbumImage = (track) => {
    if (track?.album?.imageUrl) {
      return track.album.imageUrl
    }
    // Fallback to track image if available
    if (track?.imageUrl) {
      return track.imageUrl
    }
    return null
  }

  return (
    <div className="billboard-container">
      <div className="billboard-header">
        <h2 className="billboard-title">{cycleName} Chart</h2>
        <div className="billboard-date">
          {nominations.length} nominations
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
                    <div className="album-art">
                      <img 
                        src={getAlbumImage(nomination.track)} 
                        alt={`${nomination.track?.title || 'Unknown'} album cover`}
                        className="album-cover-image"
                      />
                    </div>
                    <div className="song-details">
                      <div className="song-title">
                        {nomination.track?.title || nomination.trackId}
                      </div>
                      {nomination.track?.album?.title && (
                        <div className="song-album">
                          {nomination.track.album.title}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="col-artist">
                    {getArtistsString(nomination.track)}
                  </div>
                </div>
              )
            )
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