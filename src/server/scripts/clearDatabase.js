import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('🗑️  Clearing database...\n');

    // Delete in reverse FK order to avoid constraint violations
    await db.statsSnapshot.deleteMany();
    console.log('✓ Cleared StatsSnapshot');

    await db.nomination.deleteMany();
    console.log('✓ Cleared Nomination');

    await db.trackToArtist.deleteMany();
    console.log('✓ Cleared TrackToArtist');

    await db.track.deleteMany();
    console.log('✓ Cleared Track');

    await db.album.deleteMany();
    console.log('✓ Cleared Album');

    await db.artist.deleteMany();
    console.log('✓ Cleared Artist');

    await db.cycle.deleteMany();
    console.log('✓ Cleared Cycle');

    console.log('\n✅ Database cleared successfully!');

  } catch (error) {
    console.error('\n❌ Clear failed:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

clearDatabase();
