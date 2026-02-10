import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new PrismaClient();

async function importData() {
  try {
    console.log('🔍 Reading export file...\n');

    // Read exported data
    const exportPath = path.join(__dirname, '../../../prisma/sqlite-export.json');
    const exportFile = fs.readFileSync(exportPath, 'utf8');
    const exportData = JSON.parse(exportFile);

    console.log(`📦 Found export from ${exportData.exportDate}`);
    console.log(`📊 Total records to import: ${Object.values(exportData.counts).reduce((a, b) => a + b, 0)}\n`);

    const { data } = exportData;

    // Import in FK-safe order
    console.log('⏳ Importing cycles...');
    for (const cycle of data.cycles) {
      await db.cycle.create({ data: cycle });
    }
    console.log(`✓ Imported ${data.cycles.length} cycles`);

    console.log('⏳ Importing artists...');
    for (const artist of data.artists) {
      await db.artist.create({ data: artist });
    }
    console.log(`✓ Imported ${data.artists.length} artists`);

    console.log('⏳ Importing albums...');
    for (const album of data.albums) {
      await db.album.create({ data: album });
    }
    console.log(`✓ Imported ${data.albums.length} albums`);

    console.log('⏳ Importing tracks...');
    for (const track of data.tracks) {
      await db.track.create({ data: track });
    }
    console.log(`✓ Imported ${data.tracks.length} tracks`);

    console.log('⏳ Importing track-artist links...');
    for (const link of data.trackToArtists) {
      await db.trackToArtist.create({ data: link });
    }
    console.log(`✓ Imported ${data.trackToArtists.length} track-artist links`);

    console.log('⏳ Importing nominations...');
    for (const nomination of data.nominations) {
      await db.nomination.create({ data: nomination });
    }
    console.log(`✓ Imported ${data.nominations.length} nominations`);

    console.log('⏳ Importing stats snapshots...');
    for (const snapshot of data.statsSnapshots) {
      await db.statsSnapshot.create({ data: snapshot });
    }
    console.log(`✓ Imported ${data.statsSnapshots.length} stats snapshots`);

    // Update sequences to match highest IDs
    console.log('\n⏳ Updating sequences...');
    
    const maxCycleId = Math.max(...data.cycles.map(c => c.id), 0);
    await db.$executeRaw`SELECT setval('"Cycle_id_seq"', ${maxCycleId}, true)`;
    
    const maxArtistId = Math.max(...data.artists.map(a => a.id), 0);
    await db.$executeRaw`SELECT setval('"Artist_id_seq"', ${maxArtistId}, true)`;
    
    const maxAlbumId = Math.max(...data.albums.map(a => a.id), 0);
    await db.$executeRaw`SELECT setval('"Album_id_seq"', ${maxAlbumId}, true)`;
    
    const maxTrackId = Math.max(...data.tracks.map(t => t.id), 0);
    await db.$executeRaw`SELECT setval('"Track_id_seq"', ${maxTrackId}, true)`;
    
    const maxNominationId = Math.max(...data.nominations.map(n => n.id), 0);
    await db.$executeRaw`SELECT setval('"Nomination_id_seq"', ${maxNominationId}, true)`;
    
    console.log('✓ Sequences updated');

    // Verify counts
    console.log('\n🔍 Verifying import...');
    const counts = {
      cycles: await db.cycle.count(),
      artists: await db.artist.count(),
      albums: await db.album.count(),
      tracks: await db.track.count(),
      trackToArtists: await db.trackToArtist.count(),
      nominations: await db.nomination.count(),
      statsSnapshots: await db.statsSnapshot.count()
    };

    console.log('\nExpected vs Actual:');
    let allMatch = true;
    for (const [table, count] of Object.entries(counts)) {
      const expected = exportData.counts[table];
      const match = count === expected ? '✓' : '✗';
      if (count !== expected) allMatch = false;
      console.log(`  ${match} ${table}: ${count} / ${expected}`);
    }

    if (allMatch) {
      console.log('\n✅ Import successful! All record counts match.');
    } else {
      console.log('\n⚠️  Warning: Some record counts don\'t match. Please verify data.');
    }

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    console.error('\nNote: This script requires DATABASE_URL to point to PostgreSQL/Supabase.');
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

importData();
