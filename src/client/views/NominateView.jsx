import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/NominateView.css'
import { useToast } from '../components/Toast'
import { invalidateAll } from '../lib/queryClient'

// "7 Jun 2024" — falls back to whatever the API gave us
function formatReleaseDate(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// The API sends { error } on failure — show that rather than a bare status code
async function readError(response, fallback) {
  try {
    const body = await response.json()
    if (body?.error) return body.error
  } catch {
    // non-JSON body, fall through
  }
  return `${fallback} ${response.status}`
}

function formatDuration(durationMs) {
  if (!durationMs) return ''
  const minutes = Math.floor(durationMs / 60000)
  const seconds = Math.floor((durationMs % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export default function NominateView() {
  const [cycles, setCycles] = useState([])
  const [activeCycle, setActiveCycle] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [nominatedTracks, setNominatedTracks] = useState(new Set())
  const [searchMode, setSearchMode] = useState('tracks') // 'tracks' or 'albums'
  const [selectedAlbum, setSelectedAlbum] = useState(null) // For viewing album tracks
  const [albumTracks, setAlbumTracks] = useState([])
  const [isLoadingAlbum, setIsLoadingAlbum] = useState(false)
  const toast = useToast()

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

  // Seed the "already in this cycle" set from the cycle itself, not just this session
  useEffect(() => {
    if (!activeCycle) return

    fetch(`/api/cycles/${activeCycle.id}/nominations`)
      .then(r => r.json())
      .then(nominations => {
        setNominatedTracks(prev => {
          const next = new Set(prev)
          nominations.forEach(nom => {
            // Persisted tracks carry spotifyTrackId; search results use spotifyId
            const spotifyId = nom.track?.spotifyTrackId || nom.track?.spotifyId
            if (spotifyId) next.add(spotifyId)
          })
          return next
        })
      })
      .catch(console.error)
  }, [activeCycle])

  // Search for songs or albums
  const performSearch = async () => {
    if (!searchQuery.trim() || isSearching) return

    setSearchResults([])
    setIsSearching(true)
    setHasSearched(true)
    setSelectedAlbum(null) // Clear any selected album when searching

    try {
      const endpoint = searchMode === 'albums' ? '/api/search/album' : '/api/search'
      const response = await fetch(
        `${endpoint}?q=${encodeURIComponent(searchQuery)}`
      )
      if (!response.ok) throw new Error(await readError(response, 'Search error'))
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
      toast(`Search failed: ${error.message}`, 'warn')
    } finally {
      setIsSearching(false)
    }
  }

  // Fetch tracks from a selected album
  const fetchAlbumTracks = async (album) => {
    setIsLoadingAlbum(true)
    try {
      const response = await fetch(`/api/search/album/${album.id}`)
      if (!response.ok) throw new Error(await readError(response, 'Album fetch error'))
      const data = await response.json()

      setSelectedAlbum({
        id: album.id,
        title: data.albumTitle,
        imageUrl: data.imageUrl,
        releaseDate: data.releaseDate,
        artist: album.artist
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
      toast(`Could not open that album: ${error.message}`, 'warn')
    } finally {
      setIsLoadingAlbum(false)
    }
  }

  // Nominate a track
  const nominateTrack = async (track) => {
    if (!activeCycle) {
      toast('There is no active cycle to nominate into.', 'warn')
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
        // The home hero and cycles archive cache this cycle's nominations.
        invalidateAll()
        toast(`“${track.name}” added to ${activeCycle.name}, unranked.`)
      } else {
        const errorText = await res.text()
        toast(`Could not nominate that track: ${errorText}`, 'warn')
      }
    } catch (error) {
      console.error('Nomination failed:', error)
      toast('Could not nominate that track. Please try again.', 'warn')
    }
  }

  const isTrackNominated = (trackSpotifyId) => nominatedTracks.has(trackSpotifyId)

  const switchMode = (mode) => {
    if (mode === searchMode) return
    setSearchMode(mode)
    setSearchResults([])
    setHasSearched(false)
    setSelectedAlbum(null)
    setAlbumTracks([])
  }

  // Handle search on Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      performSearch()
    }
  }

  // Go back to search results from album view
  const goBackToSearch = () => {
    setSelectedAlbum(null)
    setAlbumTracks([])
  }

  const inCycleLabel = activeCycle ? `In ${activeCycle.name}` : 'In cycle'

  return (
    <section className="nominate-view">
      <div className="nominate-head">
        <div>
          <h1 className="page-title">Nominate</h1>
          <p className="page-sub">
            {activeCycle ? (
              <>
                Currently adding tracks to <Link to={`/cycles/${activeCycle.id}`}>{activeCycle.name}</Link>.
              </>
            ) : (
              <>
                No cycle is active, so nothing can be nominated yet.{' '}
                <Link to="/cycles">Make one active</Link> first.
              </>
            )}
          </p>
        </div>

        <div className="mode-pill">
          <button
            className={`mode-button ${searchMode === 'tracks' ? 'active' : ''}`}
            onClick={() => switchMode('tracks')}
          >
            Tracks
          </button>
          <button
            className={`mode-button ${searchMode === 'albums' ? 'active' : ''}`}
            onClick={() => switchMode('albums')}
          >
            Albums
          </button>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder={searchMode === 'albums' ? 'Search albums…' : 'Search tracks…'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="btn-accent search-button"
          onClick={performSearch}
          disabled={!searchQuery.trim() || isSearching}
        >
          {isSearching ? 'Searching…' : 'Search'}
        </button>
      </div>

      {isSearching && (
        <p className="results-state">Searching {searchMode}…</p>
      )}

      {selectedAlbum ? (
        <div className="album-view">
          <button className="btn-outline album-back" onClick={goBackToSearch}>
            ← Back to results
          </button>

          <div className="album-header">
            <div className="album-cover art-tile">
              {selectedAlbum.imageUrl && (
                <img
                  src={selectedAlbum.imageUrl}
                  alt=""
                  onError={e => { e.currentTarget.style.display = 'none' }}
                />
              )}
            </div>
            <div>
              <h2 className="album-title">{selectedAlbum.title}</h2>
              <p className="album-meta">
                {[
                  selectedAlbum.artist,
                  formatReleaseDate(selectedAlbum.releaseDate) &&
                    `Released ${formatReleaseDate(selectedAlbum.releaseDate)}`,
                  albumTracks.length > 0 &&
                    `${albumTracks.length} ${albumTracks.length === 1 ? 'track' : 'tracks'}`,
                ].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>

          {isLoadingAlbum ? (
            <p className="results-state">Loading album tracks…</p>
          ) : (
            <div className="tracklist">
              {albumTracks.map((track, index) => {
                const done = isTrackNominated(track.spotifyId)
                return (
                  <div key={track.id} className="tracklist-row">
                    <span className="tracklist-no">{index + 1}</span>
                    <div className="tracklist-text">
                      <div className="tracklist-title">{track.name}</div>
                      <div className="tracklist-artist">{track.artist}</div>
                    </div>
                    <span className="tracklist-duration">{formatDuration(track.durationMs)}</span>
                    <button
                      className={done ? 'btn-outline is-done' : 'btn-accent nominate-button'}
                      onClick={() => nominateTrack(track)}
                      disabled={!activeCycle || done}
                    >
                      {done ? inCycleLabel : 'Nominate'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        !isSearching && (
          searchResults.length > 0 ? (
            <div>
              <div className="results-head">
                <h3 className="results-label">
                  {searchMode === 'albums' ? 'Album results' : 'Track results'}
                </h3>
                <span className="results-rule" />
              </div>

              <div className="results-list">
                {searchResults.map(result => {
                  const already = searchMode === 'tracks' && isTrackNominated(result.spotifyId)

                  return (
                    <div key={result.id} className="result-row">
                      <div className="result-art art-tile">
                        {(result.image || result.imageUrl) && (
                          <img
                            src={result.image || result.imageUrl}
                            alt=""
                            loading="lazy"
                            onError={e => { e.currentTarget.style.display = 'none' }}
                          />
                        )}
                      </div>
                      <div className="result-text">
                        <div className="result-name">{result.name || result.title}</div>
                        <div className="result-sub">
                          {[result.artist, searchMode === 'tracks' ? result.album : null]
                            .filter(Boolean).join(' · ')}
                        </div>
                      </div>

                      {searchMode === 'albums' ? (
                        <button
                          className="btn-outline"
                          onClick={() => fetchAlbumTracks(result)}
                        >
                          View tracks
                        </button>
                      ) : already ? (
                        <span className="chip-in-cycle">{inCycleLabel}</span>
                      ) : (
                        <button
                          className="btn-accent nominate-button"
                          onClick={() => nominateTrack(result)}
                          disabled={!activeCycle}
                        >
                          Nominate
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : hasSearched && (
            <p className="results-state">Nothing matched “{searchQuery}”.</p>
          )
        )
      )}
    </section>
  )
}
