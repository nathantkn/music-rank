import db from '../db.js';
import { getSpotifyAccessToken } from './spotifyAuth.js';


// 1) Fetch a Spotify track
export async function fetchSpotifyTrack(spotifyTrackId) {
    const token = await getSpotifyAccessToken();
    const res = await fetch(
        `https://api.spotify.com/v1/tracks/${spotifyTrackId}`,
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        }
    );
    if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
    const data = await res.json();

    const imageUrl = data.album.images?.[0]?.url ?? null;

    return {
        id:         data.id,
        title:      data.name,
        durationMs: data.duration_ms,
        album: {
            id:          data.album.id,
            title:       data.album.name,
            imageUrl
        },
        artists: data.artists.map(a => ({ id: a.id, name: a.name }))
    };
}

// 2) Fetch artist details from Spotify
export async function fetchSpotifyArtistDetails(spotifyArtistId) {
    const token = await getSpotifyAccessToken();

    const res = await fetch(
        `https://api.spotify.com/v1/artists/${spotifyArtistId}`,
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );

    if (!res.ok) {
        throw new Error(`Spotify Artist API error ${res.status}`);
    }

    const data = await res.json();
    return {
        name: data.name,
        imageUrl: data.images?.[0]?.url ?? null
    };
}

// 3) Upsert into SQLite via Prisma
export async function upsertTrack({ spotifyId, youtubeId, fetched }) {
    // 1) Artist
    let artist = null;
    if (fetched.artist) {
        artist = await db.artist.upsert({
            where:   { spotifyArtistId: fetched.artist.id },
            create:  { spotifyArtistId: fetched.artist.id, name: fetched.artist.name },
            update:  { name: fetched.artist.name }
        });
    }

    // 2) Album
    let album = null;
    if (fetched.album) {
        album = await db.album.upsert({
            where:   { spotifyAlbumId: fetched.album.id },
            create: {
                spotifyAlbumId: fetched.album.id,
                title:           fetched.album.title,
                imageUrl:        fetched.album.imageUrl
            },
            update: {
                title:       fetched.album.title,
                imageUrl:    fetched.album.imageUrl
            }
        });
    }

    // 3) Track
    const trackWhere = spotifyId
        ? { spotifyTrackId: spotifyId }
        : { youtubeVideoId: youtubeId };

    const trackData = {
        title:      fetched.title,
        durationMs: fetched.durationMs ?? null,
        albumId:    album?.id ?? null,
        youtubeVideoId: youtubeId ?? null,
        spotifyTrackId: spotifyId ?? undefined
    };

    const track = await db.track.upsert({
        where:  trackWhere,
        create: trackData,
        update: trackData
    });

    for (const art of fetched.artists) {
        // upsert each artist
        const existing = await db.artist.findUnique({
            where: { spotifyArtistId: art.id }
        });

        let imageUrl = existing?.imageUrl;

        if (!imageUrl) {
            try {
                const details = await fetchSpotifyArtistDetails(art.id);
                imageUrl = details.imageUrl;
            } catch (e) {
                console.warn('Could not fetch Spotify artist image:', e);
            }
        }

        const artist = await db.artist.upsert({
            where:   { spotifyArtistId: art.id },
            create:  { spotifyArtistId: art.id, name: art.name, imageUrl },
            update:  { name: art.name, imageUrl }
        });

        // upsert into the join table:
        await db.trackToArtist.upsert({
            where: {
                trackId_artistId: { trackId: track.id, artistId: artist.id }
            },
            create: {
                track:   { connect: { id: track.id } },
                artist:  { connect: { id: artist.id } }
            },
            update: {}
        });
    }

    return track;
}

// 4) Search Spotify tracks by query
export async function searchSpotifyTracks(query) {
    const token = await getSpotifyAccessToken();
    const res = await fetch(
        `https://api.spotify.com/v1/search?type=track&limit=20&q=${encodeURIComponent(query)}`,
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Spotify search API error ${res.status}: ${err}`);
    }
    const data = await res.json();
    return data.tracks.items.map(item => ({
        id:        item.id,
        spotifyId: item.id,
        title:     item.name,
        artists:   item.artists.map(a => a.name).join(', '),
        artistIds: item.artists.map(a => a.id),
        album:     item.album?.name ?? '',
        image:     item.album?.images?.[0]?.url ?? ''
    }));
}

export async function searchAlbums(query) {
    const token = await getSpotifyAccessToken();
    const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!res.ok) {
        throw new Error(`Spotify album search failed: ${res.status}`);
    }

    const data = await res.json();
    return data.albums.items.map(album => ({
        id: album.id,
        title: album.name,
        artist: album.artists.map(a => a.name).join(', '),
        imageUrl: album.images?.[0]?.url || null
    }));
}

export async function fetchAlbumTracks(spotifyAlbumId) {
    const token = await getSpotifyAccessToken();
    const res = await fetch(`https://api.spotify.com/v1/albums/${spotifyAlbumId}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!res.ok) {
        throw new Error(`Spotify album fetch failed: ${res.status}`);
    }

    const data = await res.json();
    return {
        albumTitle: data.name,
        imageUrl: data.images?.[0]?.url || null,
        releaseDate: data.release_date,
        tracks: data.tracks.items.map(track => ({
            id: track.id,
            title: track.name,
            durationMs: track.duration_ms,
            artists: track.artists.map(a => ({ id: a.id, name: a.name }))
        }))
    };
}