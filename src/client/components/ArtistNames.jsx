import { Link } from 'react-router-dom'
import { getArtistLinks, getArtistsString } from '../lib/nominations'

/**
 * A track's artists, each name its own link to their profile. Reads the same
 * as the plain joined string it replaces — comma-separated, no decoration
 * beyond the hover colour — so it drops into a chart row without changing the
 * line.
 *
 * Tracks that predate artist links only carry a name string, and those render
 * as text; there's nothing to link to.
 */
export default function ArtistNames({ track, className = '' }) {
  const artists = getArtistLinks(track)

  if (!artists.length) {
    return <span className={className}>{getArtistsString(track)}</span>
  }

  return (
    <span className={className}>
      {artists.map((artist, i) => (
        <span key={artist.id}>
          {i > 0 && ', '}
          <Link className="artist-link" to={`/artists/${artist.id}`}>
            {artist.name}
          </Link>
        </span>
      ))}
    </span>
  )
}
