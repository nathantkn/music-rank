import '../styles/RankTable.css'
import { getAlbumImage, getArtistsString, rankedOf, unrankedOf } from '../lib/nominations'

// Missing artwork falls back to a bare tile at the same size and radius.
function Artwork({ src, className }) {
  return (
    <div className={`art-tile ${className}`}>
      {src && (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={e => { e.currentTarget.style.display = 'none' }}
        />
      )}
    </div>
  )
}

export function TopThree({ nominations = [] }) {
  const top = rankedOf(nominations).slice(0, 3)
  if (!top.length) return null

  return (
    <div className="top3-grid">
      {top.map(nom => (
        <article key={nom.id} className="top3-card">
          <div className="top3-art art-tile">
            {getAlbumImage(nom.track) && (
              <img
                src={getAlbumImage(nom.track)}
                alt=""
                loading="lazy"
                onError={e => { e.currentTarget.style.display = 'none' }}
              />
            )}
            <span className={`top3-rank ${nom.rank === 1 ? 'is-first' : ''}`}>
              {nom.rank}
            </span>
          </div>
          <div>
            <div className="top3-title">{nom.track?.title || nom.trackId}</div>
            <div className="top3-artist">{getArtistsString(nom.track)}</div>
          </div>
        </article>
      ))}
    </div>
  )
}

function UnrankedWell({ nominations = [] }) {
  const unranked = unrankedOf(nominations)
  if (!unranked.length) return null

  return (
    <div className="unranked-well">
      <div className="unranked-head">
        <h3 className="unranked-label">Not yet ranked</h3>
        <span className="unranked-note">
          {unranked.length} {unranked.length === 1 ? 'nomination' : 'nominations'} with no position
        </span>
      </div>
      <div className="unranked-pills">
        {unranked.map(nom => (
          <div key={nom.id} className="unranked-pill">
            <Artwork src={getAlbumImage(nom.track)} className="unranked-thumb" />
            <span className="unranked-title">{nom.track?.title || nom.trackId}</span>
            <span className="unranked-artist">{getArtistsString(nom.track)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * The chart card. `variant="home"` drops the first three (they render as top-3
 * cards above it) and keeps every rank numeral in accent; `variant="full"` shows
 * every ranked row with only #1 in accent. Unranked nominations are never given
 * a position — they render in the well underneath.
 */
export default function RankTable({
  nominations = [],
  variant = 'full',
  showUnranked = true,
}) {
  const ranked = rankedOf(nominations)
  const rows = variant === 'home' ? ranked.slice(3) : ranked

  return (
    <>
      <div className="chart-card">
        <div className="chart-grid chart-head">
          <div>Pos</div>
          <div>Song</div>
          <div className="chart-artist">Artist</div>
          <div className="chart-album">Album</div>
        </div>

        {rows.length > 0 ? (
          rows.map(nom => (
            <div key={nom.id} className="chart-grid chart-row">
              <div className={`chart-rank ${variant === 'home' || nom.rank === 1 ? 'is-accent' : ''}`}>
                {nom.rank}
              </div>
              <div className="chart-song">
                <Artwork src={getAlbumImage(nom.track)} className="chart-thumb" />
                <div className="chart-song-text">
                  <div className="chart-title">{nom.track?.title || nom.trackId}</div>
                  <div className="chart-song-sub">{getArtistsString(nom.track)}</div>
                </div>
              </div>
              <div className="chart-artist">{getArtistsString(nom.track)}</div>
              <div className="chart-album">{nom.track?.album?.title || '—'}</div>
            </div>
          ))
        ) : (
          <div className="chart-empty">
            {ranked.length > 0
              ? 'Every ranked nomination is in the top 3.'
              : 'Nothing ranked yet.'}
          </div>
        )}
      </div>

      {showUnranked && <UnrankedWell nominations={nominations} />}
    </>
  )
}
