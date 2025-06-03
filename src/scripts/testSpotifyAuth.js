import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.SPOTIFY_CLIENT_ID = 'id';
process.env.SPOTIFY_CLIENT_SECRET = 'secret';

test('caches Spotify token between calls', async (t) => {
    let callCount = 0;
    t.mock.method(global, 'fetch', async () => {
        callCount++;
        return { ok: true, json: async () => ({ access_token: 'token123', expires_in: 3600 }) };
    });

    const { getSpotifyAccessToken } = await import('../src/services/spotifyAuth.js');

    const first = await getSpotifyAccessToken();
    const second = await getSpotifyAccessToken();

    assert.equal(first, 'token123');
    assert.equal(second, 'token123');
    assert.equal(callCount, 1);
});
