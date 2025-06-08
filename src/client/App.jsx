import { useEffect, useState, useRef } from 'react'
import './App.css'
import RankTable from './components/RankTable'

// Main App Component
export default function App() {
  const [selectedCycle, setSelectedCycle] = useState(null)
  const [nominations, setNominations] = useState([])
  const [stats, setStats] = useState(null)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [artistOfCycleTrack, setArtistOfCycleTrack] = useState(null)
  const autoRotateRef = useRef(null)

  useEffect(() => {
    // Fetch stats
    fetch(`/api/stats`)
      .then(async (res) => {
          if (!res.ok) {
            throw new Error('Failed to fetch stats')
          }
          const data = await res.json()

          // Get the most recent stats (first in array since ordered by computedAt desc)
          if (data.length > 0) {
            const mostRecentStats = data[0]
            setStats(mostRecentStats)
            setSelectedCycle(mostRecentStats.cycle)

            // Fetch nominations for the last cycle
            fetch(`/api/cycles/${mostRecentStats.cycle.id}/nominations`)
              .then(r => r.json())
              .then(nominationsData => {
                setNominations(nominationsData)
                
                // Now find the nomination after nominations are loaded
                if (mostRecentStats.artistOfCycle) {
                  const artistOfCycleNom = nominationsData
                    .filter(nom => 
                      nom.track?.artistLinks?.some(link => link.artist.id === mostRecentStats.artistOfCycle.id)
                    )
                    .sort((a, b) => a.rank - b.rank)[0];

                  setArtistOfCycleTrack(artistOfCycleNom)
                }
              })
              .catch(console.error)
          }
      })
      .catch(console.error)
  }, [])

  // Auto-rotate cards every 5 seconds
  useEffect(() => {
    if (!stats) return
    
    const startAutoRotate = () => {
      autoRotateRef.current = setInterval(() => {
        setCurrentCardIndex(prev => (prev + 1) % 3)
      }, 7000)
    }
    
    startAutoRotate()
    
    return () => {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current)
      }
    }
  }, [stats])

  // Reset auto-rotate when manually changing cards
  const handleCardChange = (newIndex) => {
    setCurrentCardIndex(newIndex)
    if (autoRotateRef.current) {
      clearInterval(autoRotateRef.current)
      autoRotateRef.current = setInterval(() => {
        setCurrentCardIndex(prev => (prev + 1) % 3)
      }, 7000)
    }
  }

  // Helper function to get all artists from artistLinks
  const getArtistsString = (track) => {
    if (track?.artistLinks && track.artistLinks.length > 0) {
      return track.artistLinks.map(link => link.artist.name).join(', ')
    }
    return track?.artist || ''
  }

  // Create card data
  const getCardData = () => {
    if (!stats || !artistOfCycleTrack) return []
    
    return [
      {
        type: 'Track of the Cycle',
        text: `${stats.trackOfCycle.title} by ${getArtistsString(stats.trackOfCycle) || 'Unknown Artist'} is #1 on ${stats.cycle.name}.`,
        image: stats.trackOfCycle?.album?.imageUrl,
      },
      {
        type: 'Artist of the Cycle',
        text: `${stats.artistOfCycle.name} has the most nominations on ${stats.cycle.name}. "${artistOfCycleTrack.track.title}" is ranked #${artistOfCycleTrack.rank}.`,
        image: stats.artistOfCycle?.imageUrl,
      },
      {
        type: 'Best New Artist',
        text: `${stats.bestNewArtist.name} is the newest entry of Best New Artist!`,
        image: stats.bestNewArtist?.imageUrl,
      }
    ]
  }

  const cards = getCardData()
  const currentCard = cards[currentCardIndex]

  return (
    <>
      <div className="hero-section">
        {stats && currentCard && (
          <>
            <button 
              className="nav-arrow nav-arrow-left"
              onClick={() => handleCardChange((currentCardIndex - 1 + 3) % 3)}
            >
              ←
            </button>
            
            <div className="hero-content">
              <div className="card-indicator">
                <span className="card-type">{currentCard.type}</span>
              </div>
              <h1 className="hero-title">
                {currentCard.text}
              </h1>
            </div>
            
            <div className="hero-image">
              {currentCard.image ? (
                <img 
                  src={currentCard.image} 
                  alt={`${currentCard.title}`}
                  className="hero-image-content"
                />
              ) : (
                <div className="hero-image-fallback">
                  {currentCard.icon}
                </div>
              )}
            </div>
            
            <button 
              className="nav-arrow nav-arrow-right"
              onClick={() => handleCardChange((currentCardIndex + 1) % 3)}
            >
              →
            </button>
            <div className="card-dots">
              {cards.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${index === currentCardIndex ? 'active' : ''}`}
                  onClick={() => handleCardChange(index)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="content">
        {selectedCycle && (
          <RankTable 
            cycleId={selectedCycle.id}
            nominations={nominations}
            cycleName={selectedCycle.name}
          />
        )}
      </div>
    </>
  )
}