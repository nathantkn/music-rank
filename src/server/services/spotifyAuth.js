import dotenv from 'dotenv';
import dayjs from 'dayjs';
dotenv.config();

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;

// Cache for Spotify token & expiry
let spotifyToken = null;
let spotifyTokenExpiresAt = null;

export async function getSpotifyAccessToken() {
    if (spotifyToken && dayjs().isBefore(spotifyTokenExpiresAt)) {
        console.log('Using cached Spotify token');
        return spotifyToken;
    }

    const creds = Buffer
        .from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)
        .toString('base64');

    const resp = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${creds}`,
        },
        body: new URLSearchParams({ grant_type: 'client_credentials' })
    });

    if (!resp.ok) {
        throw new Error(`Token request failed: ${resp.status}`);
    }
    
    const { access_token, expires_in } = await resp.json();
    spotifyToken = access_token;
    spotifyTokenExpiresAt = dayjs().add(expires_in - 60, 'second');
    return spotifyToken;
}
