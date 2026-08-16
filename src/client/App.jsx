import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import './App.css'
import RankTable, { TopThree } from './components/RankTable'
import { rankedOf, getArtistsString } from './lib/nominations'
import { statsQuery, nominationsQuery, highlightsQuery } from './lib/api'

// A cycle only has something to say once it's been ranked and computed — an
// empty snapshot has no Track/Artist of the Cycle to build the hero cards from.
const isComputed = (snapshot) => Boolean(snapshot?.trackOfCycle && snapshot?.artistOfCycle)

// Lead with the active cycle; if it hasn't been ranked and computed yet, fall
// back to the most recent cycle that has been.
function pickFeatured(statsList) {
  if (!statsList?.length) return null
  const active = statsList.find(snapshot => snapshot.cycle.isActive)
  if (isComputed(active)) return active
  return statsList.find(isComputed) ?? statsList[0]
}

function findArtistOfCycleNomination(artist, nominations) {
  if (!artist) return null
  return nominations
    .filter(nom =>
      nom.track?.artistLinks?.some(link => link.artist.id === artist.id)
    )
    .sort((a, b) => a.rank - b.rank)[0] || null
}

// 1st, 2nd, 3rd, 4th… — the teens are the exception to the last-digit rule
const ordinal = (n) => {
  const teens = n % 100
  if (teens >= 11 && teens <= 13) return `${n}th`
  return `${n}${{ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'}`
}

// Main App Component
export default function App() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const autoRotateRef = useRef(null)

  const { data: statsList } = useQuery(statsQuery())
  const stats = pickFeatured(statsList)
  const cycleId = stats?.cycle.id ?? null

  // Both of these hang off the featured cycle but not off each other, so they
  // go out together — waiting for nominations before asking for highlights was
  // costing a whole round trip for nothing.
  const { data: nominations = [] } = useQuery(nominationsQuery(cycleId))
  const { data: highlights } = useQuery(highlightsQuery(cycleId))

  const selectedCycle = stats?.cycle ?? null
  const artistOfCycleTrack = findArtistOfCycleNomination(stats?.artistOfCycle, nominations)

  // Create card data
  const getCardData = () => {
    if (!isComputed(stats) || !artistOfCycleTrack) return []

    const cards = [
      {
        type: 'Track of the Cycle',
        text: `"${stats.trackOfCycle.title}" by ${getArtistsString(stats.trackOfCycle)} is #1 on ${stats.cycle.name}.`,
        image: stats.trackOfCycle?.album?.imageUrl,
      },
      {
        type: 'Artist of the Cycle',
        text: `${stats.artistOfCycle.name} is ${stats.cycle.name}'s Artist of the Cycle. Their best song, "${artistOfCycleTrack.track.title}", is ranked #${artistOfCycleTrack.rank}.`,
        image: stats.artistOfCycle?.imageUrl,
      },
      {
        type: 'Best New Artist',
        text: stats.bestNewArtist
        ? `${stats.bestNewArtist.name} is the newest winner of Best New Artist, debuting on ${stats.cycle.name}!`
        : `There were no Best New Artist for ${stats.cycle.name}.`,
        image: stats.bestNewArtist?.imageUrl,
      },
    ]

    // The remaining three read history off the featured cycle. Each is skipped
    // rather than faked when the data isn't there — a winning track with no
    // album, or a cycle nobody has been nominated in.
    const album = highlights?.album
    if (album) {
      cards.push({
        type: 'Album Watch',
        text: `${album.songsNominated} ${album.songsNominated === 1 ? 'song' : 'songs'} from "${album.title}" ${album.songsNominated === 1 ? 'has' : 'have'} been nominated before. "${album.trackTitle}" is its ${ordinal(album.winNumber)} Track of the Cycle.`,
        image: album.imageUrl,
      })
    }

    const artist = highlights?.artist
    if (artist) {
      cards.push({
        type: 'Artist Watch',
        text: `${artist.name} has ${artist.nominations} career ${artist.nominations === 1 ? 'nomination' : 'nominations'}. This is their ${ordinal(artist.winNumber)} Artist of the Cycle win.`,
        image: artist.imageUrl,
      })
    }

    const debuts = highlights?.debuts
    if (debuts?.totalArtists) {
      cards.push({
        type: 'New Blood',
        text: debuts.count === 0
          ? `No new names this time; all ${debuts.totalArtists} artists on ${stats.cycle.name} have charted before.`
          : `${debuts.count} of the ${debuts.totalArtists} artists on ${stats.cycle.name} ${debuts.count === 1 ? 'is' : 'are'} nominated for the first time: ${debuts.artists.map(a => a.name).join(', ')}.`,
        image: debuts.artists.find(a => a.imageUrl)?.imageUrl,
      })
    }

    return cards
  }

  const cards = getCardData()
  const cardCount = cards.length
  // Highlight cards drop out when a cycle can't support them, so the rotation
  // has to follow the real count rather than a fixed one.
  const currentCard = cards[currentCardIndex] ?? cards[0]
  const rankedCount = rankedOf(nominations).length

  // Auto-rotate cards every 7 seconds
  useEffect(() => {
    if (cardCount < 2) return

    autoRotateRef.current = setInterval(() => {
      setCurrentCardIndex(prev => (prev + 1) % cardCount)
    }, 7000)

    return () => {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current)
      }
    }
  }, [cardCount])

  // Reset auto-rotate when manually changing cards
  const handleCardChange = (newIndex) => {
    setCurrentCardIndex(newIndex)
    if (autoRotateRef.current) {
      clearInterval(autoRotateRef.current)
      autoRotateRef.current = setInterval(() => {
        setCurrentCardIndex(prev => (prev + 1) % cardCount)
      }, 7000)
    }
  }

  return (
    <>
      <section className="hero">
        {stats && currentCard ? (
          <>
            <div className="hero-art art-tile">
              {currentCard.image ? (
                <img
                  src={currentCard.image}
                  alt=""
                  onError={e => { e.currentTarget.style.display = 'none' }}
                />
              ) : (
                <span className="hero-art-label">Artwork</span>
              )}
            </div>

            <div className="hero-body">
              <span className="hero-eyebrow">{currentCard.type}</span>
              <h1 className="hero-title">{currentCard.text}</h1>

              <div className="hero-controls">
                <div className="hero-arrows">
                  <button
                    className="hero-arrow"
                    aria-label="Previous fact"
                    onClick={() => handleCardChange((currentCardIndex - 1 + cards.length) % cards.length)}
                  >
                    ←
                  </button>
                  <button
                    className="hero-arrow"
                    aria-label="Next fact"
                    onClick={() => handleCardChange((currentCardIndex + 1) % cards.length)}
                  >
                    →
                  </button>
                </div>
                <div className="hero-dots">
                  {cards.map((card, index) => (
                    <button
                      key={card.type}
                      className={`hero-dot ${index === currentCardIndex ? 'active' : ''}`}
                      aria-label={card.type}
                      onClick={() => handleCardChange(index)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="hero-art art-tile" />
            <div className="hero-body">
              <div className="skeleton skeleton-eyebrow" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line short" />
            </div>
          </>
        )}
      </section>

      <section className="home-section">
        {selectedCycle ? (
          <>
            <div className="home-head">
              <div className="home-head-title">
                <h2>{selectedCycle.name}</h2>
                {selectedCycle.isActive && <span className="chip-active">Active</span>}
              </div>
              <div className="home-head-meta">
                <span className="home-counts">
                  {nominations.length} {nominations.length === 1 ? 'nomination' : 'nominations'} · {rankedCount} ranked
                </span>
                <Link className="home-fullchart" to={`/cycles/${selectedCycle.id}`}>
                  Full chart →
                </Link>
              </div>
            </div>

            <TopThree nominations={nominations} />
            <RankTable nominations={nominations} variant="home" />
          </>
        ) : (
          <div className="loading-spinner"></div>
        )}
      </section>
    </>
  )
}