import db from '../db.js';

export async function computeArtistsWithMostTrackOfCycle(limit = 20) {
  const results = await db.$queryRaw`
    SELECT 
        tta."artistId"            AS "subjectId",
        a."name"                  AS "subjectName",
        a."imageUrl"              AS "subjectImage",
        COUNT(*)                  AS "value"
    FROM "StatsSnapshot" s
    JOIN "Track" tr             ON s."trackOfCycleId" = tr.id
    JOIN "TrackToArtist" tta    ON tta."trackId" = tr.id
    JOIN "Artist" a             ON a.id = tta."artistId"
    WHERE s."trackOfCycleId" IS NOT NULL
    GROUP BY tta."artistId", a."name", a."imageUrl"
    ORDER BY "value" DESC
    LIMIT ${limit};
  `;

  return results.map(row => ({
    ...row,
    value: Number(row.value)
  }));
}

export async function computeArtistsWithMostArtistOfCycle(limit = 20) {
  const results = await db.$queryRaw`
    SELECT 
        s."artistOfCycleId"       AS "subjectId",
        a."name"                  AS "subjectName",
        a."imageUrl"              AS "subjectImage",
        COUNT(*)                  AS "value"
    FROM "StatsSnapshot" s
    JOIN "Artist" a             ON a.id = s."artistOfCycleId"
    WHERE s."artistOfCycleId" IS NOT NULL
    GROUP BY s."artistOfCycleId", a."name", a."imageUrl"
    ORDER BY "value" DESC
    LIMIT ${limit};
  `;

  return results.map(row => ({
    ...row,
    value: Number(row.value)
  }));
}

export async function computeArtistsWithMostNominations(limit = 20) {
  const results = await db.$queryRaw`
    SELECT 
        tta."artistId"            AS "subjectId",
        a."name"                  AS "subjectName",
        a."imageUrl"              AS "subjectImage",
        COUNT(*)                  AS "value"
    FROM "Nomination" n
    JOIN "Track" tr             ON n."trackId" = tr.id
    JOIN "TrackToArtist" tta    ON tta."trackId" = tr.id
    JOIN "Artist" a             ON a.id = tta."artistId"
    GROUP BY tta."artistId", a."name", a."imageUrl"
    ORDER BY "value" DESC
    LIMIT ${limit};
  `;

  return results.map(row => ({
    ...row,
    value: Number(row.value)
  }));
}

export async function computeArtistsWithMostSongsInCycle(limit = 20) {
  const results = await db.$queryRaw`
    WITH per_cycle_counts AS (
      SELECT
            tta."artistId"                   AS "artistId",
            n."cycleId"                      AS "cycleId",
            COUNT(DISTINCT n."trackId")      AS "trackCountInCycle"
      FROM "Nomination" n
      JOIN "Track" tr                    ON n."trackId" = tr.id
      JOIN "TrackToArtist" tta           ON tta."trackId" = tr.id
      JOIN "Artist" a                    ON a.id = tta."artistId"
      GROUP BY tta."artistId", n."cycleId"
    )
    SELECT
      pcc."artistId"                    AS "subjectId",
      a."name"                          AS "subjectName",
      a."imageUrl"                      AS "subjectImage",
      MAX(pcc."trackCountInCycle")      AS "value"
    FROM per_cycle_counts pcc
    JOIN "Artist" a                     ON a.id = pcc."artistId"
    GROUP BY pcc."artistId", a."name", a."imageUrl"
    ORDER BY "value" DESC
    LIMIT ${limit};
  `;

  return results.map(row => ({
    ...row,
    value: Number(row.value)
  }));
}

export async function computeLongestSongsAcrossAllCycles(limit = 20) {
  const results = await db.$queryRaw`
    SELECT
        tr.id                       AS "subjectId",
        tr."title"                  AS "subjectName",
        al."imageUrl"                AS "subjectImage",
        tr."durationMs"             AS "value"
    FROM "Track" tr
    JOIN "Album" al             ON tr."albumId" = al.id
    WHERE tr."albumId" IS NOT NULL
    GROUP BY tr.id, tr."title", tr."durationMs", al."imageUrl"
    ORDER BY tr."durationMs" DESC
    LIMIT ${limit};
  `;

  return results.map(row => {
    const durationMs = Number(row.value);
    
    const totalSeconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    let formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    return {
      ...row,
      value: formattedDuration,
    };
  });
}

export async function computeAlbumsWithMostSongsNominated(limit = 20) {
  const results = await db.$queryRaw`
    SELECT
        tr."albumId"                                     AS "subjectId",
        al."title"                                       AS "subjectName",
        al."imageUrl"                                    AS "subjectImage",
        COUNT(DISTINCT n."trackId")                      AS "value"
    FROM "Nomination" n
    JOIN "Track" tr             ON n."trackId" = tr.id
    JOIN "Album" al             ON tr."albumId" = al.id
    WHERE tr."albumId" IS NOT NULL
    GROUP BY tr."albumId", al."title", al."imageUrl"
    ORDER BY "value" DESC
    LIMIT ${limit};
  `;

  return results.map(row => ({
    ...row,
    value: Number(row.value)
  }));
}

export async function computeArtistsWithMostCycleAppearances(limit = 20) {
  const results = await db.$queryRaw`
    SELECT
      tta."artistId"         AS "subjectId",
      a."name"               AS "subjectName",
      a."imageUrl"           AS "subjectImage",
      COUNT(DISTINCT n."cycleId") AS "value"
    FROM "Nomination" n
    JOIN "Track" tr          ON n."trackId" = tr.id
    JOIN "TrackToArtist" tta ON tta."trackId" = tr.id
    JOIN "Artist" a          ON a.id = tta."artistId"
    GROUP BY tta."artistId", a."name", a."imageUrl"
    ORDER BY value DESC
    LIMIT ${limit};
  `;

  return results.map(row => ({
    ...row,
    value: Number(row.value)
  }));
}

export async function computeArtistsWithLongestCycleStreak(limit = 20) {
  const cycles = await db.cycle.findMany({ orderBy: { id: 'asc' }, select: { id: true } });
  const cycleOrder = cycles.map(c => c.id);

  const appearances = await db.$queryRaw`
    SELECT
      tta."artistId" AS "artistId",
      n."cycleId"    AS "cycleId",
      a."name"       AS "subjectName",
      a."imageUrl"   AS "subjectImage"
    FROM "Nomination" n
    JOIN "Track" tr           ON n."trackId" = tr.id
    JOIN "TrackToArtist" tta  ON tr.id = tta."trackId"
    JOIN "Artist" a           ON a.id = tta."artistId"
    GROUP BY tta."artistId", n."cycleId"
    ORDER BY tta."artistId", n."cycleId";
  `;

  const artistToCycles = new Map();
  for (const row of appearances) {
    if (!artistToCycles.has(row.artistId)) {
      artistToCycles.set(row.artistId, {
        name: row.subjectName,
        imageUrl: row.subjectImage,
        cycles: []
      });
    }
    artistToCycles.get(row.artistId).cycles.push(row.cycleId);
  }

  function longestConsecutiveStreak(cycleIds, allCycles) {
    const appearancesSet = new Set(cycleIds);
    let maxStreak = 0, currentStreak = 0;
    for (const c of allCycles) {
      if (appearancesSet.has(c)) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    return maxStreak;
  }

  const streaks = [];

  for (const [artistId, artistData] of artistToCycles) {
    const streak = longestConsecutiveStreak(artistData.cycles, cycleOrder);
    streaks.push({
      subjectId: artistId,
      subjectName: artistData.name,
      subjectImage: artistData.imageUrl,
      value: streak
    });
  }

  return streaks
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map(row => ({
      ...row,
      value: Number(row.value)
    }));
}

export async function computeAlbumsWithMostTrackOfCycle(limit = 20) {
  const results = await db.$queryRaw`
    SELECT
      al.id             AS "subjectId",
      al.title          AS "subjectName",
      al."imageUrl"     AS "subjectImage",
      COUNT(*)          AS "value"
    FROM "StatsSnapshot" s
    JOIN "Track" tr     ON s."trackOfCycleId" = tr.id
    JOIN "Album" al     ON tr."albumId" = al.id
    WHERE tr."albumId" IS NOT NULL
    GROUP BY al.id, al.title, al."imageUrl"
    ORDER BY value DESC
    LIMIT ${limit};
  `;

  return results.map(row => ({
    ...row,
    value: Number(row.value)
  }));
}

