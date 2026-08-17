import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { artistQuery } from '../lib/api'
import { initial } from '../lib/artists'
import { ordinal } from '../lib/format'
import '../styles/ArtistDetail.css'

// The three award colours come from the shared .award-* variants in index.css,
// so a win reads the same here as it does on a cycle page. `badge` is the
// three-letter form the history gutter uses, where there's no room for the name.
const AWARDS = [
  { key: 'trackOfCycle', label: 'Track of the Cycle', variant: 'award-track', badge: 'TOC' },
  { key: 'artistOfCycle', label: 'Artist of the Cycle', variant: 'award-artist', badge: 'AOC' },
  { key: 'bestNewArtist', label: 'Best New Artist', variant: 'award-debut', badge: 'BNA' },
]

const wonAnything = (cycle) => AWARDS.some(award => cycle.awards[award.key])

// Cycles arrive newest first, so filtering preserves that and [0] is the most
// recent win — which is the one the award tile leads with.
const awardCycles = (cycles, key) => cycles.filter(cycle => cycle.awards[key])

function Portrait({ name, imageUrl }) {
  return (
    <div className={`artist-portrait ${imageUrl ? 'art-tile' : 'is-monogram'}`}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          onError={e => { e.currentTarget.style.display = 'none' }}
        />
      ) : (
        <span className="artist-portrait-initial">{initial(name)}</span>
      )}
    </div>
  )
}

function Stat({ value, label }) {
  return (
    <div className="artist-stat">
      <span className="artist-stat-value">{value}</span>
      <span className="artist-stat-label">{label}</span>
    </div>
  )
}

// Every tile is the same height whether the artist won seventeen of something
// or none, so the row keeps its shape from artist to artist. The full list of
// winning cycles doesn't fit and doesn't try — the tile leads with the most
// recent one and hands the rest to the panel below the row.
function AwardTile({ award, cycles, isOpen, onToggle }) {
  const count = cycles.length
  const extra = count - 1

  return (
    <article className={`award-tile ${award.variant} ${count ? '' : 'is-empty'}`}>
      <div className="award-tile-label">{award.label}</div>

      <div className="award-tile-figure">
        <span className="award-tile-count">{count}</span>
        <span className="award-tile-unit">{count === 1 ? 'win' : 'wins'}</span>
      </div>

      <div className="award-tile-foot">
        {count > 0 ? (
          <>
            <Link className="award-tile-cycle" to={`/cycles/${cycles[0].cycleId}`}>
              {cycles[0].cycleName}
            </Link>
            {extra > 0 && (
              <button
                type="button"
                className="award-tile-more"
                onClick={onToggle}
                aria-expanded={isOpen}
              >
                +{extra} more
              </button>
            )}
          </>
        ) : (
          <span className="award-tile-never">Never won</span>
        )}
      </div>
    </article>
  )
}

// Full width under the row rather than inside the tile it came from: seventeen
// freeform cycle names need the whole page, and expanding one tile in place
// would push the other two out of alignment.
function AwardPanel({ award, cycles, onClose }) {
  return (
    <div className={`award-panel ${award.variant}`}>
      <div className="award-panel-head">
        <span className="award-panel-title">{award.label}</span>
        <span className="award-panel-count">{cycles.length}</span>
        <button
          type="button"
          className="award-panel-close"
          onClick={onClose}
          aria-label={`Close ${award.label} wins`}
        >
          ×
        </button>
      </div>
      <div className="award-panel-chips">
        {cycles.map(cycle => (
          <Link
            key={cycle.cycleId}
            className="award-panel-chip"
            to={`/cycles/${cycle.cycleId}`}
          >
            {cycle.cycleName}
          </Link>
        ))}
      </div>
    </div>
  )
}

function NominationRow({ nom }) {
  return (
    <div className="nom-row">
      <div className={`nom-rank ${nom.rank === 1 ? 'is-first' : ''}`}>
        {nom.rank == null
          // No numeral at all for an unranked nomination — the capsule stands in
          // for the position it doesn't have, the way the chart's well does.
          ? <span className="nom-unranked" title="Not yet ranked" />
          : nom.rank}
      </div>

      <div className="nom-art art-tile">
        {nom.albumImageUrl && (
          <img
            src={nom.albumImageUrl}
            alt=""
            loading="lazy"
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
        )}
      </div>

      <div className="nom-text">
        <div className="nom-title">{nom.title}</div>
        {nom.coArtists.length > 0 && (
          <div className="nom-with">
            with{' '}
            {nom.coArtists.map((co, i) => (
              <span key={co.id}>
                {i > 0 && ', '}
                <Link className="nom-co" to={`/artists/${co.id}`}>{co.name}</Link>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="nom-album">{nom.albumTitle || '—'}</div>
    </div>
  )
}

// One grid row per cycle. The cycle's identity sits in the left gutter beside
// its nominations rather than in a header above them, so a cycle holding a
// single nomination is exactly one row tall — which most of them are.
function CycleLedgerRow({ cycle }) {
  const won = AWARDS.filter(award => cycle.awards[award.key])

  return (
    <div className="ledger-row">
      <div className="ledger-gutter">
        <div className="ledger-cycle-line">
          <Link className="ledger-cycle" to={`/cycles/${cycle.cycleId}`}>
            {cycle.cycleName}
          </Link>
          {cycle.isActive && <span className="ledger-active">Active</span>}
        </div>

        {won.length > 0 && (
          <div className="ledger-badges">
            {won.map(award => (
              <span
                key={award.key}
                className={`ledger-badge ${award.variant}`}
                title={award.label}
              >
                {award.badge}
              </span>
            ))}
          </div>
        )}

        {/* A single-nomination cycle doesn't need counting — the row is the count. */}
        {cycle.nominations.length > 1 && (
          <div className="ledger-count">{cycle.nominations.length} nominations</div>
        )}
      </div>

      <div className="ledger-noms">
        {cycle.nominations.length === 0 ? (
          // A hand-picked Best New Artist can outlive their nomination.
          <div className="ledger-empty">
            No surviving nominations — the award still stands.
          </div>
        ) : (
          cycle.nominations.map(nom => (
            <NominationRow key={nom.nominationId} nom={nom} />
          ))
        )}
      </div>
    </div>
  )
}

export default function ArtistDetail() {
  const { artistId } = useParams()
  const { data, isPending, isError } = useQuery(artistQuery(artistId))

  const [openAward, setOpenAward] = useState(null)
  const [onlyAwarded, setOnlyAwarded] = useState(false)

  // Both states stand alone without a breadcrumb — the trail's second crumb is
  // the artist's name, and neither state has one to show.
  if (isPending) {
    return (
      <div className="artist-page artist-page-state">
        <div className="artist-loading">
          <span className="artist-loading-dot" />
          Loading artist…
        </div>
      </div>
    )
  }

  // null is the query's "no such artist"; isError is everything else going
  // wrong. Different sentences, same way out.
  if (isError || !data) {
    return (
      <div className="artist-page artist-page-state">
        <div className="artist-missing">
          <p className="artist-missing-title">
            {isError ? 'Couldn’t load that artist' : 'That artist doesn’t exist'}
          </p>
          <p className="artist-missing-copy">
            {isError
              ? 'Something went wrong fetching this profile. Try again in a moment.'
              : 'Nobody in the archive has this id. They may have been removed along with their last nomination.'}
          </p>
          <Link className="artist-missing-back" to="/artists">Back to artists</Link>
        </div>
      </div>
    )
  }

  const { artist, totals, cycles } = data
  const shown = onlyAwarded ? cycles.filter(wonAnything) : cycles
  const openCycles = openAward ? awardCycles(cycles, openAward.key) : []

  return (
    <>
      <div className="crumbs">
        <Link to="/artists">Artists</Link>
        <span>/</span>
        <span className="crumb-current">{artist.name}</span>
      </div>

      <section className="artist-page">
        <header className="artist-head">
          <Portrait name={artist.name} imageUrl={artist.imageUrl} />
          <div className="artist-head-body">
            <h1 className="artist-name">{artist.name}</h1>
            <div className="artist-stats">
              <Stat value={totals.nominations} label="Nominations" />
              <Stat value={totals.cyclesAppeared} label="Cycles" />
              <Stat
                value={totals.bestRank ? ordinal(totals.bestRank) : '—'}
                label="Best rank"
              />
            </div>
          </div>
        </header>

        <div className="award-row">
          {AWARDS.map(award => {
            const won = awardCycles(cycles, award.key)
            return (
              <AwardTile
                key={award.key}
                award={award}
                cycles={won}
                isOpen={openAward?.key === award.key}
                // One panel at a time — opening another replaces it.
                onToggle={() =>
                  setOpenAward(openAward?.key === award.key ? null : award)
                }
              />
            )
          })}
        </div>

        {openAward && (
          <AwardPanel
            award={openAward}
            cycles={openCycles}
            onClose={() => setOpenAward(null)}
          />
        )}

        <div className="history-head">
          <h2 className="history-title">History</h2>
          <span className="history-summary">
            {cycles.length} {cycles.length === 1 ? 'cycle' : 'cycles'}
            {' · '}{totals.nominations}{' '}
            {totals.nominations === 1 ? 'nomination' : 'nominations'}
          </span>
          <div className="history-filters">
            <button
              type="button"
              className={`history-filter ${onlyAwarded ? '' : 'is-active'}`}
              onClick={() => setOnlyAwarded(false)}
            >
              All
            </button>
            <button
              type="button"
              className={`history-filter ${onlyAwarded ? 'is-active' : ''}`}
              onClick={() => setOnlyAwarded(true)}
            >
              Awarded
            </button>
          </div>
        </div>

        {onlyAwarded && (
          <p className="history-showing">
            Showing {shown.length} of {cycles.length} cycles.
          </p>
        )}

        {cycles.length === 0 ? (
          <div className="ledger-empty ledger-empty-page">Nothing on record.</div>
        ) : shown.length === 0 ? (
          <div className="ledger-empty ledger-empty-page">
            No awards in any cycle yet.
          </div>
        ) : (
          <div className="ledger">
            {shown.map(cycle => (
              <CycleLedgerRow key={cycle.cycleId} cycle={cycle} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
