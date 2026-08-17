// Shared artist display helpers.

// Array.from, not name[0] — indexing a string splits surrogate pairs, so names
// outside the BMP would render half a character. Used everywhere an artist
// portrait can be missing, which is often: only the multi-artist upsert path
// fetches an image from Spotify.
export function initial(name) {
  return (Array.from(name ?? '')[0] ?? '?').toUpperCase()
}
