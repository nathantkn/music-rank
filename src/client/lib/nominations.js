// Shared helpers for reading nomination / track shapes off the API.

export function getArtistsString(track) {
  if (track?.artistLinks && track.artistLinks.length > 0) {
    return track.artistLinks.map(link => link.artist.name).join(', ')
  }
  return track?.artist || 'Unknown Artist'
}

export function getAlbumImage(track) {
  return track?.album?.imageUrl || track?.imageUrl || null
}

// A ranked nomination has a real position; everything else is unranked and never
// gets a number rendered for it.
export function rankedOf(nominations) {
  return nominations
    .filter(nom => nom.rank != null)
    .sort((a, b) => a.rank - b.rank)
}

export function unrankedOf(nominations) {
  return nominations.filter(nom => nom.rank == null)
}
