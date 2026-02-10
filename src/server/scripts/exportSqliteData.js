import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new PrismaClient();

async function exportData() {
  try {
    console.log('🔍 Exporting SQLite data...\n');

    // Query all tables in FK-safe order
    const cycles = await db.cycle.findMany();
    console.log(`✓ Exported ${cycles.length} cycles`);

    const artists = await db.artist.findMany();
    console.log(`✓ Exported ${artists.length} artists`);

    const albums = await db.album.findMany();
    console.log(`✓ Exported ${albums.length} albums`);

    const tracks = await db.track.findMany();
    console.log(`✓ Exported ${tracks.length} tracks`);

    const trackToArtists = await db.trackToArtist.findMany();
    console.log(`✓ Exported ${trackToArtists.length} track-artist links`);

    const nominations = await db.nomination.findMany();
    console.log(`✓ Exported ${nominations.length} nominations`);

    const statsSnapshots = await db.statsSnapshot.findMany();
    console.log(`✓ Exported ${statsSnapshots.length} stats snapshots`);

    // Bundle data with metadata
    const exportData = {
      exportDate: new Date().toISOString(),
      counts: {
        cycles: cycles.length,
        artists: artists.length,
        albums: albums.length,
        tracks: tracks.length,
        trackToArtists: trackToArtists.length,
        nominations: nominations.length,
        statsSnapshots: statsSnapshots.length
      },
      data: {
        cycles,
        artists,
        albums,
        tracks,
        trackToArtists,
        nominations,
        statsSnapshots
      }
    };

    // Write to JSON file
    const outputPath = path.join(__dirname, '../../../prisma/sqlite-export.json');
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

    console.log(`\n✅ Data successfully exported to prisma/sqlite-export.json`);
    console.log(`\nTotal records: ${Object.values(exportData.counts).reduce((a, b) => a + b, 0)}`);
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

exportData();
