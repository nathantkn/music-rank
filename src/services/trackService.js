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

    return {
        id:         data.id,
        title:      data.name,
        durationMs: data.duration_ms,
        album: {
            id:          data.album.id,
            title:       data.album.name,
        },
        artist: {
            id:   data.artists[0].id,
            name: data.artists[0].name
        }
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
            create:  { spotifyAlbumId: fetched.album.id, title: fetched.album.title},
            update:  { title: fetched.album.title }
        });
    }

    // 3) Track
    const where = spotifyId
        ? { spotifyTrackId: spotifyId }
        : { youtubeVideoId: youtubeId };

    const data = {
        title:      fetched.title,
        durationMs: fetched.durationMs ?? null,
        artistId:   artist?.id ?? null,
        albumId:    album?.id  ?? null,
        youtubeVideoId: youtubeId ?? null
    };

    return db.track.upsert({
        where,
        create: {
            ...data,
            spotifyTrackId: spotifyId ?? undefined
        },
        update: data
    });
}
