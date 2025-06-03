// scripts/testTrackService.js
import { fetchSpotifyTrack, upsertTrack } from '../services/trackService.js';
import db from '../db.js';

async function main() {
    try {
        // 1) Fetch & upsert a known Spotify track
        const spotifyId = '11dFghVXANMlKmJXsNCbNl';  // “Mr. Brightside” as an example
        const fetched = await fetchSpotifyTrack(spotifyId);
        console.log('Fetched Spotify metadata:', fetched);

        const track = await upsertTrack({
            spotifyId,
            youtubeId: null,
            fetched
        });
        console.log('Upserted track record:', track);

        // 2) Optionally, fetch it back via Prisma to verify
        const fromDb = await db.track.findUnique({ where: { id: track.id }, include: { artist: true, album: true } });
        console.log('Track in DB:', fromDb);
    } catch (err) {
        console.error('Error during test:', err);
    } finally {
        await db.$disconnect();
        process.exit(0);
    }
}

main();
