import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { artistsQuery } from '../lib/api'
import { initial } from '../lib/artists'
import '../styles/ArtistsView.css'

// 500-odd artists is 500-odd remote portraits and 500-odd cards; a cold load
// spent most of its time on rows nobody had scrolled to. The whole roster still
// arrives in one payload — it's small, and filtering and sorting stay instant
// across all of it — but only a page of it is ever mounted.
const PAGE_SIZE = 60

// The server already sorts by nominations; the other two orders are cheap to
// do here rather than as extra round trips.
const SORTS = {
  nominations: { label: 'Most nominations', compare: (a, b) => b.nominations - a.nominations },
  wins: { label: 'Most wins', compare: (a, b) => b.wins - a.wins },
  name: { label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
}

// The directory payload carries each award's count separately, so narrowing to
// one award's winners is a predicate over data already in memory rather than a
// round trip. `noun` is for the empty state, which has to name what came back
// empty — "No Artist of the Cycle winners yet" beats a bare "no matches".
const AWARDS = {
  all: { label: 'All artists', noun: 'artist', match: () => true },
  bestNewArtist: {
    label: 'Best New Artist',
    noun: 'Best New Artist winner',
    match: a => a.bestNewArtist > 0,
  },
  trackOfCycle: {
    label: 'Track of the Cycle',
    noun: 'Track of the Cycle winner',
    match: a => a.trackOfCycle > 0,
  },
  artistOfCycle: {
    label: 'Artist of the Cycle',
    noun: 'Artist of the Cycle winner',
    match: a => a.artistOfCycle > 0,
  },
}

// First, last, and a step either side of the current page, so the control keeps
// its width whether there are nine pages or ninety. Gaps are strings rather
// than nulls so every child has a stable key.
function pageWindow(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const wanted = [1, total, current, current - 1, current + 1]
    .filter(page => page >= 1 && page <= total)
    .sort((a, b) => a - b)

  const out = []
  let previous = 0
  for (const page of wanted) {
    if (page === previous) continue
    if (previous && page - previous > 1) out.push(`gap-${page}`)
    out.push(page)
    previous = page
  }
  return out
}

function ArtistCard({ artist }) {
  return (
    <Link className="artist-card" to={`/artists/${artist.id}`}>
      <div className="artist-card-art art-tile">
        {artist.imageUrl ? (
          <img
            src={artist.imageUrl}
            alt=""
            loading="lazy"
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <span className="artist-card-initial">{initial(artist.name)}</span>
        )}
      </div>
      <h3 className="artist-card-name">{artist.name}</h3>
      <p className="artist-card-meta">
        {artist.nominations} {artist.nominations === 1 ? 'nom' : 'noms'}
        {' · '}{artist.cyclesAppeared} {artist.cyclesAppeared === 1 ? 'cycle' : 'cycles'}
      </p>
      {/* Its own line and its own colour — a win is the one thing on this card
          that isn't just a tally, and the gold is how the Records page says so. */}
      {artist.wins > 0 && (
        <p className="artist-card-wins">
          {artist.wins} {artist.wins === 1 ? 'win' : 'wins'}
        </p>
      )}
    </Link>
  )
}

export default function ArtistsView() {
  const [filter, setFilter] = useState('')
  const [award, setAward] = useState('all')
  const [sort, setSort] = useState('nominations')
  const [page, setPage] = useState(1)

  const { data: artists = [], isPending, isError } = useQuery(artistsQuery())

  // The award pool, before the name box narrows it further: the count the
  // empty state and the "filtered from" line compare against.
  const pool = useMemo(
    () => (award === 'all' ? artists : artists.filter(AWARDS[award].match)),
    [artists, award]
  )

  const shown = useMemo(() => {
    const needle = filter.trim().toLowerCase()
    const matched = needle
      ? pool.filter(a => a.name.toLowerCase().includes(needle))
      : pool
    // Ties fall back to name so the grid doesn't reshuffle between sorts.
    return [...matched].sort(
      (a, b) => SORTS[sort].compare(a, b) || a.name.localeCompare(b.name)
    )
  }, [pool, filter, sort])

  const pageCount = Math.max(1, Math.ceil(shown.length / PAGE_SIZE))
  // Clamped rather than reset: a filter that narrows the list past the current
  // page shouldn't be able to strand you on an empty one.
  const current = Math.min(page, pageCount)
  const start = (current - 1) * PAGE_SIZE
  const pageItems = shown.slice(start, start + PAGE_SIZE)
  // What the count line and the empty state call the things in the grid.
  const { noun } = AWARDS[award]

  // Paging swaps the whole grid out from under you, so it goes back to the top
  // rather than leaving you mid-list in unrelated names.
  const goToPage = (next) => {
    setPage(next)
    window.scrollTo(0, 0)
  }

  const narrow = (update) => {
    update()
    setPage(1)
  }

  return (
    <section className="artists-view">
      <div className="artists-head">
        <div>
          <h1 className="page-title">Artists</h1>
        </div>

        <div className="artists-controls">
          <input
            className="artists-filter"
            type="search"
            value={filter}
            onChange={e => narrow(() => setFilter(e.target.value))}
            placeholder="Find an artist…"
            aria-label="Filter artists by name"
          />
          <select
            className="artists-award"
            value={award}
            onChange={e => narrow(() => setAward(e.target.value))}
            aria-label="Filter artists by award"
          >
            {Object.entries(AWARDS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            className="artists-sort"
            value={sort}
            onChange={e => narrow(() => setSort(e.target.value))}
            aria-label="Sort artists"
          >
            {Object.entries(SORTS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {isPending ? (
        <div className="artists-empty">Loading artists…</div>
      ) : isError ? (
        <div className="artists-empty">Couldn’t load the artist list.</div>
      ) : shown.length === 0 ? (
        <div className="artists-empty">
          {artists.length === 0
            ? 'No artists yet — nominate a track to get started.'
            : pool.length === 0
              ? `No ${noun}s yet.`
              : `No ${noun} matches “${filter.trim()}”.`}
        </div>
      ) : (
        <>
          <p className="artists-count">
            Showing {start + 1}–{start + pageItems.length} of {shown.length}
            {' '}{shown.length === 1 ? noun : `${noun}s`}
            {shown.length !== artists.length && ` (filtered from ${artists.length})`}
          </p>

          <div className="artists-grid">
            {pageItems.map(artist => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>

          {pageCount > 1 && (
            <nav className="artists-pager" aria-label="Artist pages">
              <button
                type="button"
                className="pager-step"
                onClick={() => goToPage(current - 1)}
                disabled={current === 1}
              >
                ← Prev
              </button>

              <div className="pager-pages">
                {pageWindow(current, pageCount).map(entry =>
                  typeof entry === 'number' ? (
                    <button
                      key={entry}
                      type="button"
                      className={`pager-page ${entry === current ? 'is-current' : ''}`}
                      aria-current={entry === current ? 'page' : undefined}
                      onClick={() => goToPage(entry)}
                    >
                      {entry}
                    </button>
                  ) : (
                    <span key={entry} className="pager-gap">…</span>
                  )
                )}
              </div>

              <button
                type="button"
                className="pager-step"
                onClick={() => goToPage(current + 1)}
                disabled={current === pageCount}
              >
                Next →
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  )
}
