import db from '../db.js';

/**
 * Recomputes and upserts StatsSnapshot for a given cycleId.
 *
 * @param {number} cycleId
 * @param {number|null} bestNewArtistId  // pass in the manual Best New Artist (or null)
 */
export async function recomputeStatsForCycle(cycleId, bestNewArtistId = null) {
  // 1) Get the rank‐1 nomination’s trackId (Track of the Cycle)
  const topNom = await db.nomination.findFirst({
    where: { cycleId, rank: 1 },
    select: { trackId: true },
  });
  const trackOfCycleId = topNom?.trackId ?? null;

  // 2) Compute “Artist of the Cycle”
  //    We need to count how many nominations each artist has in this cycle,
  //    then, among artists tied in that count, pick the one whose best‐ranked nomination is lowest.
  //
  //    In raw SQL (SQLite), that can be done by joining Nomination→Track→TrackToArtist,
  //    grouping by artistId, and computing:
  //      COUNT(*) AS nomination_count
  //      MIN("Nomination"."rank") AS best_rank
  //    Then ORDER BY nomination_count DESC, best_rank ASC, LIMIT 1.
  //    We’ll use Prisma’s $queryRaw for that.

  const topArtistResult = await db.$queryRaw`
    SELECT 
      "tta"."artistId" AS "artistId",
      COUNT(*)           AS nomination_count,
      MIN("Nomination"."rank") AS best_rank
    FROM "Nomination"
    JOIN "Track" ON "Nomination"."trackId" = "Track"."id"
    JOIN "TrackToArtist" AS tta ON tta."trackId" = "Track"."id"
    WHERE "Nomination"."cycleId" = ${cycleId}
    GROUP BY tta."artistId"
    ORDER BY nomination_count DESC, best_rank ASC
    LIMIT 1;
  `;

  // If no nominations exist, leave it null
  const artistOfCycleId = topArtistResult[0]?.artistId ?? null;

  // 3) Upsert into StatsSnapshot
  await db.statsSnapshot.upsert({
    where: { cycleId },
    update: {
      trackOfCycleId,
      artistOfCycleId,
      bestNewArtistId,
      computedAt: new Date(),
    },
    create: {
      cycleId,
      trackOfCycleId:       trackOfCycleId ? trackOfCycleId : undefined,
      artistOfCycleId:      artistOfCycleId ? artistOfCycleId : undefined,
      bestNewArtistId:      bestNewArtistId ? bestNewArtistId : undefined,
    }
  });

  return {
    cycleId,
    trackOfCycleId,
    artistOfCycleId,
    bestNewArtistId,
  };
}
