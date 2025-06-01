import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/NominateView.css'

export default function NominateView() {
  const [cycles, setCycles] = useState([])
  const [activeCycle, setActiveCycle] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
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

  // Search for songs (Spotify API)
  const searchSongs = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      // Call your backend proxy or Spotify directly
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}`
      )
      if (!response.ok) throw new Error(`Search error ${response.status}`)
      const data = await response.json()
      // console.log('Search results:', data)
      const results = data.map(item => ({
        id:        item.id,         // keep the unique id
        name:      item.title,      // use `item.title` instead of `item.name`
        artist:    item.artist,     // `item.artist` is already a string
        album:     item.album,      // `item.album` is already a string
        image:     item.image,      // take the URL string directly
        spotifyId: item.spotifyId   // or `item.id`, whichever matches your nomination payload
      }));
      setSearchResults(results)
    } catch (error) {
      console.error('Search failed:', error)
      alert(`Search failed: ${error.message}`)
    } finally {
      setIsSearching(false)
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
          rank: null // You can add rank selection later if needed
        })
      })
      
      if (res.ok) {
        alert(`Successfully nominated "${track.name}" by ${track.artist}!`)
        // Optionally clear search results or mark as nominated
      } else {
        const errorText = await res.text()
        alert(`Failed to nominate track: ${errorText}`)
      }
    } catch (error) {
      console.error('Nomination failed:', error)
      alert('Failed to nominate track. Please try again.')
    }
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
      searchSongs()
    }
  }

  return (
    <div className="nominate-view">
      <h1 className="nominate-title">Nominate a Track</h1>
      
      <div className="search-section">
        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Search for songs, artists, or albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button 
            className="search-button"
            onClick={searchSongs}
            disabled={!searchQuery.trim() || isSearching}
          >
            {isSearching ? '...' : 'Search'}
          </button>
        </div>
        
        {searchResults.length > 0 && (
          <div className="search-results">
            <h3 className="results-title">Search Results</h3>
            <div className="results-list">
              {searchResults.map(track => (
                <div key={track.id} className="result-item">
                  <img 
                    src={track.image} 
                    alt={`${track.name} cover`}
                    className="result-image"
                  />
                  <div className="result-info">
                    <div className="result-name">{track.name}</div>
                    <div className="result-artist">{track.artist}</div>
                    <div className="result-album">{track.album}</div>
                  </div>
                  <button 
                    className="nominate-button"
                    onClick={() => nominateTrack(track)}
                    disabled={!activeCycle}
                  >
                    Nominate
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {isSearching && (
          <div className="loading">
            <div className="loading-spinner"></div>
            <span>Searching for songs...</span>
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