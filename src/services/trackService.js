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

// 2) Fetch a YouTube video’s metadata
export async function fetchYouTubeVideo(videoId) {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`);
    if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
    const { items } = await res.json();
    if (!items.length) throw new Error('YouTube video not found');

    const item = items[0];
    return {
        id:        item.id,
        title:     item.snippet.title,
        thumbnail: item.snippet.thumbnails.default.url,
        duration:  item.contentDetails.duration  // ISO8601 string, e.g. "PT3M15S"
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
        const artist = await db.artist.upsert({
            where:   { spotifyArtistId: art.id },
            create:  { spotifyArtistId: art.id, name: art.name },
            update:  { name: art.name }
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