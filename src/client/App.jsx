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
  const [trackOfCycleLeader, setTrackOfCycleLeader] = useState(null)
  const [artistOfCycleLeader, setArtistOfCycleLeader] = useState(null)
  const [mostNominationsLeader, setMostNominationsLeader] = useState(null)
  const autoRotateRef = useRef(null)

  async function fetchStats() {
    const res = await fetch(`/api/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  }

  async function fetchNominations(cycleId) {
    const res = await fetch(`/api/cycles/${cycleId}/nominations`);
    if (!res.ok) throw new Error(`Failed to fetch nominations for cycle ${cycleId}`);
    return res.json();
  }

  function findArtistOfCycleNomination(artist, nominations) {
    if (!artist) return null;
    return nominations
      .filter(nom =>
        nom.track?.artistLinks?.some(link => link.artist.id === artist.id)
      )
      .sort((a, b) => a.rank - b.rank)[0] || null;
  }

  async function fetchLeaderboard(leaderboardId) {
    const res = await fetch(`/api/leaderboards/${leaderboardId}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const leader = data && data.length > 0 ? data[0] : null;
    return leader;
  }

  useEffect(() => {
    async function initialize() {
      try {
        const statsList = await fetchStats();
        if (!statsList.length) return;

        const mostRecent = statsList[0];
        setStats(mostRecent);
        setSelectedCycle(mostRecent.cycle);

        const nominationsData = await fetchNominations(mostRecent.cycle.id);
        setNominations(nominationsData);

        const artistNom = findArtistOfCycleNomination(
          mostRecent.artistOfCycle,
          nominationsData
        );
        setArtistOfCycleTrack(artistNom);

        const trackOfCycleLeader = await fetchLeaderboard('track-of-cycle');
        setTrackOfCycleLeader(trackOfCycleLeader)

        const artistOfCycleLeader = await fetchLeaderboard('artist-of-cycle');
        setArtistOfCycleLeader(artistOfCycleLeader)

        const mostNominationsLeader = await fetchLeaderboard('most-nominations');
        setMostNominationsLeader(mostNominationsLeader)
      } catch (err) {
        console.error(err);
      }
    }

    initialize();
  }, []);

  // Auto-rotate cards every 7 seconds
  useEffect(() => {
    if (!stats) return
    
    const startAutoRotate = () => {
      autoRotateRef.current = setInterval(() => {
        setCurrentCardIndex(prev => (prev + 1) % 6)
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
        setCurrentCardIndex(prev => (prev + 1) % 6)
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
    if (!stats || !artistOfCycleTrack || !trackOfCycleLeader || !artistOfCycleLeader || !mostNominationsLeader) return []
    
    return [
      {
        type: 'Track of the Cycle',
        text: `"${stats.trackOfCycle.title}" by ${getArtistsString(stats.trackOfCycle) || 'Unknown Artist'} is #1 on ${stats.cycle.name}.`,
        image: stats.trackOfCycle?.album?.imageUrl,
      },
      {
        type: 'Artist of the Cycle',
        text: `${stats.artistOfCycle.name} is ${stats.cycle.name}'s Artist of the Cycle. Their best song, "${artistOfCycleTrack.track.title}", is ranked #${artistOfCycleTrack.rank}.`,
        image: stats.artistOfCycle?.imageUrl,
      },
      {
        type: 'Best New Artist',
        text: `${stats.bestNewArtist.name} is the newest winner of Best New Artist, debuting on ${stats.cycle.name}!`,
        image: stats.bestNewArtist?.imageUrl,
      },
      {
        type: 'Most Track of the Cycle',
        text: `${trackOfCycleLeader.subjectName} has the most "Track of the Cycle" awards, winning ${trackOfCycleLeader.value} ${trackOfCycleLeader.value === 1 ? 'time' : 'times'}!`,
        image: trackOfCycleLeader?.subjectImage,
      },
      {
        type: 'Most Artist of the Cycle',
        text: `${artistOfCycleLeader.subjectName} has the most "Artist of the Cycle" awards, winning ${artistOfCycleLeader.value} ${artistOfCycleLeader.value === 1 ? 'time' : 'times'}!`,
        image: artistOfCycleLeader?.subjectImage,
      },
      {
        type: 'Most Total Nominations',
        text: `${mostNominationsLeader.subjectName} is the most nominated artist in history, with ${mostNominationsLeader.value} total ${mostNominationsLeader.value === 1 ? 'nomination' : 'nominations'}!`,
        image: mostNominationsLeader?.subjectImage,
      }
    ]
  }

  const cards = getCardData()
  const currentCard = cards[currentCardIndex]

  return (
    <>
      <div className="hero-section">
        {stats && currentCard ? (
          <>
            <button 
              className="nav-arrow nav-arrow-left"
              onClick={() => handleCardChange((currentCardIndex - 1 + 6) % 6)}
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
              onClick={() => handleCardChange((currentCardIndex + 1) % 6)}
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
        ) : (
          <div className="hero-loading">
            <div className="loading-content">
              <div className="loading-skeleton loading-title"></div>
              <div className="loading-skeleton loading-text"></div>
              <div className="loading-skeleton loading-text short"></div>
            </div>
            <div className="loading-image">
              <div className="loading-spinner small"></div>
            </div>
          </div>
        )}
      </div>

      <div className="content">
        {selectedCycle ? (
          <RankTable 
            cycleId={selectedCycle.id}
            nominations={nominations}
            cycleName={selectedCycle.name}
          />
        ) : (
          <div className="loading-spinner"></div>
        )}
      </div>
    </>
  )
}