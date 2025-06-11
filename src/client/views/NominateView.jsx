import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/NominateView.css'

export default function NominateView() {
  const [cycles, setCycles] = useState([])
  const [activeCycle, setActiveCycle] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [nominatedTracks, setNominatedTracks] = useState(new Set())
  const [searchMode, setSearchMode] = useState('tracks') // 'tracks' or 'albums'
  const [selectedAlbum, setSelectedAlbum] = useState(null) // For viewing album tracks
  const [albumTracks, setAlbumTracks] = useState([])
  const [isLoadingAlbum, setIsLoadingAlbum] = useState(false)
  const navigate = useNavigate()

  // Fetch all cycles
  useEffect(() => {
    fetch('/api/cycles')
      .then(r => r.json())
      .then(setCycles)
      .catch(console.error)
  }, [])

  // Find active cycle
  useEffect(() => {
    const active = cycles.find(c => c.isActive)
    setActiveCycle(active)
  }, [cycles])

  // Search for songs or albums
  const performSearch = async () => {
    if (!searchQuery.trim()) return

    setSearchResults([])
    setIsSearching(true)
    setSelectedAlbum(null) // Clear any selected album when searching
    
    try {
      const endpoint = searchMode === 'albums' ? '/api/search/album' : '/api/search'
      const response = await fetch(
        `${endpoint}?q=${encodeURIComponent(searchQuery)}`
      )
      if (!response.ok) throw new Error(`Search error ${response.status}`)
      const data = await response.json()

      if (searchMode === 'albums') {
        // Album search results have different structure
        const results = data.map(item => ({
          id: item.id,
          title: item.title,
          artist: item.artist,
          imageUrl: item.imageUrl
        }))
        setSearchResults(results)
      } else {
        // Track search results (existing logic)
        const results = data.map(item => ({
          id: item.id,
          name: item.title,
          artist: item.artists || 'Unknown Artist',
          album: item.album,
          image: item.image,
          spotifyId: item.spotifyId,
          artistIds: item.artistIds || [],
        }))
        setSearchResults(results)
      }
    } catch (error) {
      console.error('Search failed:', error)
      alert(`Search failed: ${error.message}`)
    } finally {
      setIsSearching(false)
    }
  }

  // Fetch tracks from a selected album
  const fetchAlbumTracks = async (albumId) => {
    setIsLoadingAlbum(true)
    try {
      const response = await fetch(`/api/search/album/${albumId}`)
      if (!response.ok) throw new Error(`Album fetch error ${response.status}`)
      const data = await response.json()
      
      setSelectedAlbum({
        id: albumId,
        title: data.albumTitle,
        imageUrl: data.imageUrl,
        releaseDate: data.releaseDate
      })
      
      // Transform tracks to match the nomination format
      const tracks = data.tracks.map(track => ({
        id: track.id,
        name: track.title,
        artist: track.artists.map(a => a.name).join(', '),
        album: data.albumTitle,
        image: data.imageUrl,
        spotifyId: track.id,
        artistIds: track.artists.map(a => a.id),
        durationMs: track.durationMs
      }))
      
      setAlbumTracks(tracks)
    } catch (error) {
      console.error('Failed to fetch album tracks:', error)
      alert(`Failed to fetch album tracks: ${error.message}`)
    } finally {
      setIsLoadingAlbum(false)
    }
  }


  // Nominate a track
  const nominateTrack = async (track) => {
    if (!activeCycle) {
      alert('No active cycle found!')
      return
    }

    try {
      const res = await fetch('/api/nominations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycleId: activeCycle.id,
          spotifyTrackId: track.spotifyId,
          rank: null
        })
      })
      
      if (res.ok) {
        setNominatedTracks(prev => new Set([...prev, track.spotifyId]))
      } else {
        const errorText = await res.text()
        alert(`Failed to nominate track: ${errorText}`)
      }
    } catch (error) {
      console.error('Nomination failed:', error)
      alert('Failed to nominate track. Please try again.')
    }
  }

  // Check if a track is nominated
  const isTrackNominated = (trackSpotifyId) => {
    return nominatedTracks.has(trackSpotifyId)
  }

  // Navigate to active cycle
  const goToActiveCycle = () => {
    if (activeCycle) {
      navigate(`/cycles/${activeCycle.id}`)
    }
  }

  // Handle search on Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      performSearch()
    }
  }

  // Go back to search results from album view
  const goBackToSearch = () => {
    setSelectedAlbum(null)
    setAlbumTracks([])
  }

  // Format duration from milliseconds to mm:ss
  const formatDuration = (durationMs) => {
    if (!durationMs) return ''
    const minutes = Math.floor(durationMs / 60000)
    const seconds = Math.floor((durationMs % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="nominate-view">
      <h1 className="nominate-title">Nominate a Track</h1>
      
      <div className="search-section">
        {/* Search Mode Toggle */}
        <div className="search-mode-toggle">
          <button 
            className={`mode-button ${searchMode === 'tracks' ? 'active' : ''}`}
            onClick={() => {
              setSearchMode('tracks')
              setSearchResults([])
              setSelectedAlbum(null)
              setAlbumTracks([])
            }}
          >
            Search Tracks
          </button>
          <button 
            className={`mode-button ${searchMode === 'albums' ? 'active' : ''}`}
            onClick={() => {
              setSearchMode('albums')
              setSearchResults([])
              setSelectedAlbum(null)
              setAlbumTracks([])
            }}
          >
            Search Albums
          </button>
        </div>

        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder={searchMode === 'albums' ? 'Search for albums...' : 'Search for songs...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button 
            className="search-button"
            onClick={performSearch}
            disabled={!searchQuery.trim() || isSearching}
          >
            {isSearching ? '...' : 'Search'}
          </button>
        </div>

        {/* Loading State */}
        {isSearching && (
          <div className="search-results">
            <h3 className="results-title">Searching...</h3>
            <div className="loading">
              <div className="loading-spinner"></div>
              <span>Searching for {searchMode}...</span>
            </div>
          </div>
        )}

        {/* Album View */}
        {selectedAlbum && (
          <div className="album-view">
            <div className="album-header">
              <button className="back-button" onClick={goBackToSearch}>
                ← Back to Results
              </button>
              <div className="album-info">
                {selectedAlbum.imageUrl && (
                  <img 
                    src={selectedAlbum.imageUrl} 
                    alt={selectedAlbum.title}
                    className="album-cover"
                  />
                )}
                <div className="album-details">
                  <h2 className="album-title">{selectedAlbum.title}</h2>
                  {selectedAlbum.releaseDate && (
                    <p className="album-release-date">Released: {selectedAlbum.releaseDate}</p>
                  )}
                </div>
              </div>
            </div>

            {isLoadingAlbum ? (
              <div className="loading">
                <div className="loading-spinner"></div>
                <span>Loading album tracks...</span>
              </div>
            ) : (
              <div className="album-tracks">
                <h3 className="tracks-title">Tracks</h3>
                <div className="tracks-list">
                  {albumTracks.map(track => (
                    <div key={track.id} className="track-item">
                      <div className="track-info">
                        <div className="track-name">{track.name}</div>
                        <div className="track-artist">{track.artist}</div>
                        {track.durationMs && (
                          <div className="track-duration">{formatDuration(track.durationMs)}</div>
                        )}
                      </div>
                      <button 
                        className={`nominate-button ${isTrackNominated(track.spotifyId) ? 'nominated' : ''}`}
                        onClick={() => nominateTrack(track)}
                        disabled={!activeCycle || isTrackNominated(track.spotifyId)}
                      >
                        {isTrackNominated(track.spotifyId) ? '✓' : 'Nominate'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search Results */}
        {!selectedAlbum && searchResults.length > 0 && !isSearching && (
          <div className="search-results">
            <h3 className="results-title">
              {searchMode === 'albums' ? 'Album Results' : 'Track Results'}
            </h3>
            <div className="results-list">
              {searchResults.map(result => (
                <div key={result.id} className="result-item">
                  <div className="result-image-container">
                    {(result.image || result.imageUrl) && (
                      <img 
                        src={result.image || result.imageUrl} 
                        alt={`${result.name || result.title} cover`}
                        className="result-image"
                      />
                    )}
                  </div>
                  <div className="result-info">
                    <div className="result-name">{result.name || result.title}</div>
                    <div className="result-artist">{result.artist}</div>
                    {result.album && searchMode === 'tracks' && (
                      <div className="result-album">{result.album}</div>
                    )}
                  </div>
                  {searchMode === 'albums' ? (
                    <button 
                      className="view-album-button"
                      onClick={() => fetchAlbumTracks(result.id)}
                    >
                      View Tracks
                    </button>
                  ) : (
                    <button 
                      className={`nominate-button ${isTrackNominated(result.spotifyId) ? 'nominated' : ''}`}
                      onClick={() => nominateTrack(result)}
                      disabled={!activeCycle || isTrackNominated(result.spotifyId)}
                    >
                      {isTrackNominated(result.spotifyId) ? '✓' : 'Nominate'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="bottom-section">
        {activeCycle ? (
          <button className="active-cycle-button" onClick={goToActiveCycle}>
            Go to Active Cycle: {activeCycle.name}
          </button>
        ) : (
          <div className="no-active-cycle">
            No active cycle found
          </div>
        )}
      </div>
    </div>
  )
}