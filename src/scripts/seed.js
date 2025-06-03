// scripts/seed.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 1) Clean out old data
  await prisma.nomination.deleteMany();
  await prisma.track.deleteMany();
  await prisma.cycle.deleteMany();

  // 2) Create two cycles
  const cycle1 = await prisma.cycle.create({
    data: { name: 'Cycle 1', isActive: true },
  });
  const cycle2 = await prisma.cycle.create({
    data: { name: 'Cycle 2', isActive: false },
  });

  // 3) Create some tracks
  const [trackA, trackB, trackC, trackD] = await Promise.all([
    prisma.track.create({
      data: {
        spotifyTrackId: '3n3Ppam7vgaVa1iaRUc9Lp',
        title: 'Track A',
        durationMs: 210000,
      },
    }),
    prisma.track.create({
      data: {
        spotifyTrackId: '0eGsygTp906u18L0Oimnem',
        title: 'Track B',
        durationMs: 180000,
      },
    }),
    prisma.track.create({
      data: {
        spotifyTrackId: '7ouMYWpwJ422jRcDASZB7P',
        title: 'Track C',
        durationMs: 240000,
      },
    }),
    prisma.track.create({
      data: {
        spotifyTrackId: '6habFhsOp2NvshLv26DqMb',
        title: 'Track D',
        durationMs: 200000,
      },
    }),
  ]);

  // 4) Nominate for Cycle 1 (ranks 1–3 + 1 HM)
  await prisma.nomination.createMany({
    data: [
      { cycleId: cycle1.id, trackId: trackA.id, rank: 1 },
      { cycleId: cycle1.id, trackId: trackB.id, rank: 2 },
      { cycleId: cycle1.id, trackId: trackC.id, rank: 3 },
      { cycleId: cycle1.id, trackId: trackD.id, rank: null }, // honorable mention
    ],
  });

  // 5) Nominate for Cycle 2 (ranks 1–2 + 2 HMs)
  await prisma.nomination.createMany({
    data: [
      { cycleId: cycle2.id, trackId: trackD.id, rank: 1 },
      { cycleId: cycle2.id, trackId: trackC.id, rank: 2 },
      { cycleId: cycle2.id, trackId: trackA.id, rank: null },
      { cycleId: cycle2.id, trackId: trackB.id, rank: null },
    ],
  });

  console.log('🌱 Seed data created:');
  console.log('  Cycles:', cycle1.name, cycle2.name);
  console.log('  Tracks:', trackA.title, trackB.title, trackC.title, trackD.title);
  console.log('  Nominations inserted.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });