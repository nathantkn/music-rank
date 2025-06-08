import db from '../db.js';

export async function computeArtistsWithMostTrackOfCycle(limit = 20) {
  const results = await db.$queryRaw`
    SELECT 
        tta."artistId"            AS "subjectId",
        a."name"                  AS "subjectName",
        COUNT(*)                  AS "value"
    FROM "StatsSnapshot" s
    JOIN "Track" tr             ON s."trackOfCycleId" = tr.id
    JOIN "TrackToArtist" tta    ON tta."trackId" = tr.id
    JOIN "Artist" a             ON a.id = tta."artistId"
    WHERE s."trackOfCycleId" IS NOT NULL
    GROUP BY tta."artistId", a."name"
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
        COUNT(*)                  AS "value"
    FROM "StatsSnapshot" s
    JOIN "Artist" a             ON a.id = s."artistOfCycleId"
    WHERE s."artistOfCycleId" IS NOT NULL
    GROUP BY s."artistOfCycleId", a."name"
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
        COUNT(*)                  AS "value"
    FROM "Nomination" n
    JOIN "Track" tr             ON n."trackId" = tr.id
    JOIN "TrackToArtist" tta    ON tta."trackId" = tr.id
    JOIN "Artist" a             ON a.id = tta."artistId"
    GROUP BY tta."artistId", a."name"
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
      GROUP BY tta."artistId", n."cycleId"
    )
    SELECT
      pcc."artistId"                    AS "subjectId",
      a."name"                          AS "subjectName",
      MAX(pcc."trackCountInCycle")      AS "value"
    FROM per_cycle_counts pcc
    JOIN "Artist" a                     ON a.id = pcc."artistId"
    GROUP BY pcc."artistId", a."name"
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
        tr."durationMs"             AS "value",
        al."title"                  AS "albumTitle",
        GROUP_CONCAT(a."name", ', ') AS "artists"
    FROM "Nomination" n
    JOIN "Track" tr           ON n."trackId" = tr.id
    JOIN "TrackToArtist" tta  ON tta."trackId" = tr.id
    JOIN "Artist" a           ON a.id        = tta."artistId"
    LEFT JOIN "Album" al       ON tr."albumId" = al.id
    GROUP BY tr.id, tr."title", tr."durationMs", al."title"
    ORDER BY tr."durationMs" DESC
    LIMIT ${limit};
  `;

  return results.map(row => ({
    ...row,
    value: row.value ? Number(row.value) : null
  }));
}

export async function computeAlbumsWithMostSongsNominated(limit = 20) {
  const results = await db.$queryRaw`
    SELECT
        tr."albumId"                                     AS "subjectId",
        al."title"                                       AS "subjectName",
        COUNT(DISTINCT n."trackId")                      AS "value"
    FROM "Nomination" n
    JOIN "Track" tr             ON n."trackId" = tr.id
    JOIN "Album" al             ON tr."albumId" = al.id
    WHERE tr."albumId" IS NOT NULL
    GROUP BY tr."albumId", al."title"
    ORDER BY "value" DESC
    LIMIT ${limit};
  `;

  return results.map(row => ({
    ...row,
    value: Number(row.value)
  }));
}
