// One-off backfill: make sure every past cycle has a StatsSnapshot, so the
// all-time boards and the Big Three Sweep achievement see the full history
// instead of only the cycles that happened to be recomputed through the UI.
//
//   node src/server/scripts/backfillStatsSnapshots.js            # dry run
//   node src/server/scripts/backfillStatsSnapshots.js --apply    # writes
//
// Best New Artist is a manual pick and cannot be derived from nominations, so
// this script only ever carries an existing value forward — it never clears one
// and never invents one. Cycles still missing a Best New Artist are listed at
// the end; they have to be set by hand on the cycle page before their artist
// can complete a sweep.

import 'dotenv/config';
import db from '../db.js';
import { computeStatsForCycle, recomputeStatsForCycle } from '../services/statsService.js';
import { computeBigThreeSweepArtists } from '../services/leaderboardService.js';

const apply = process.argv.includes('--apply');

function describe(label, before, after) {
  if (before === after) return `${label}: ${after ?? '—'}`;
  return `${label}: ${before ?? '—'} → ${after ?? '—'}`;
}

async function backfill() {
  const cycles = await db.cycle.findMany({
    orderBy: { id: 'asc' },
    select: { id: true, name: true },
  });

  const snapshots = await db.statsSnapshot.findMany();
  const byCycle = new Map(snapshots.map(s => [s.cycleId, s]));

  console.log(
    `${apply ? '✍️  Applying' : '👀 Dry run —'} ${cycles.length} cycle(s), ` +
    `${snapshots.length} existing snapshot(s)\n`
  );

  let created = 0;
  let changed = 0;
  let unchanged = 0;
  const missingBestNewArtist = [];

  for (const cycle of cycles) {
    const existing = byCycle.get(cycle.id);
    const computed = await computeStatsForCycle(cycle.id);
    // Carry the manual pick forward — passing null would wipe it.
    const bestNewArtistId = existing?.bestNewArtistId ?? null;

    const isNew = !existing;
    const differs =
      existing &&
      (existing.trackOfCycleId !== computed.trackOfCycleId ||
        existing.artistOfCycleId !== computed.artistOfCycleId);

    const label = cycle.name || `Cycle ${cycle.id}`;

    if (isNew || differs) {
      if (isNew) created++; else changed++;

      console.log(`${isNew ? '＋' : '~'} ${label} (id ${cycle.id})`);
      console.log(`    ${describe('trackOfCycle', existing?.trackOfCycleId ?? null, computed.trackOfCycleId)}`);
      console.log(`    ${describe('artistOfCycle', existing?.artistOfCycleId ?? null, computed.artistOfCycleId)}`);
      console.log(`    bestNewArtist: ${bestNewArtistId ?? '— (manual, untouched)'}`);

      if (apply) {
        await recomputeStatsForCycle(cycle.id, bestNewArtistId);
      }
    } else {
      unchanged++;
    }

    if (!bestNewArtistId) {
      missingBestNewArtist.push(label);
    }
  }

  console.log(
    `\n${apply ? 'Wrote' : 'Would write'}: ${created} new, ${changed} updated, ` +
    `${unchanged} already correct.`
  );

  if (missingBestNewArtist.length > 0) {
    console.log(
      `\n⚠️  ${missingBestNewArtist.length} cycle(s) have no Best New Artist. ` +
      `It is a manual pick, so no script can fill it in:\n    ` +
      missingBestNewArtist.join('\n    ')
    );
  }

  const sweep = await computeBigThreeSweepArtists();
  console.log(`\n🏆 Big Three Sweep ${apply ? 'now' : '(unchanged by a dry run)'}: ${sweep.length} artist(s)`);
  for (const artist of sweep) {
    console.log(
      `    ${artist.subjectName} — TOC ×${artist.trackOfCycleWins}, ` +
      `AOC ×${artist.artistOfCycleWins}, BNA ×${artist.bestNewArtistWins} ` +
      `(completed in ${artist.sweptAtCycleName || `Cycle ${artist.sweptAtCycleId}`})`
    );
  }

  if (!apply) {
    console.log('\nNothing was written. Re-run with --apply to commit.');
  }
}

backfill()
  .catch(err => {
    console.error('\n❌ Backfill failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
