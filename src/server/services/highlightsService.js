import db from '../db.js';

// Per-cycle context for the home hero. Everything is counted "as of" the given
// cycle — an older cycle's card shouldn't cite nominations or wins that only
// happened later, so every count is bounded by cycleId.
//
// All three highlights come back in a single statement. They used to be three
// awaited queries, which cost three round trips; against a hosted Postgres
// that's ~230ms each and dwarfs the ~3ms the queries actually take to run.
// Firing them concurrently isn't an option — DATABASE_URL points at a
// transaction pooler, and parallel raw queries trip PgBouncer's
// prepared-statement reuse (42P05 / 26000) and poison the connection — so they
// are combined instead, which sidesteps the problem rather than paying for it.
//
// Each section is wrapped in a scalar subquery that yields JSON: row_to_json
// gives NULL when the inner query matches nothing, which is how album and
// artist stay nullable without any extra branching out here.
//
// Returns null when the cycle doesn't exist, so the caller can 404 without
// spending a separate existence check — a cycle that exists but has nothing
// computed comes back as nulls and zeroes instead.
export async function computeCycleHighlights(cycleId) {
  const [row] = await db.$queryRaw`
    SELECT
      EXISTS (SELECT 1 FROM "Cycle" WHERE id = ${cycleId}) AS "cycleExists",

      -- The album behind Track of the Cycle: how deep this chart has drawn on
      -- it, and which number win this is for it.
      (
        SELECT row_to_json(album)
        FROM (
          SELECT
            al.id           AS "albumId",
            al."title"      AS "title",
            al."imageUrl"   AS "imageUrl",
            tr."title"      AS "trackTitle",
            (
              SELECT COUNT(DISTINCT n."trackId")
              FROM "Nomination" n
              JOIN "Track" t2           ON n."trackId" = t2.id
              WHERE t2."albumId" = al.id
                AND n."cycleId" <= ${cycleId}
            )               AS "songsNominated",
            (
              SELECT COUNT(*)
              FROM "StatsSnapshot" s2
              JOIN "Track" t3           ON s2."trackOfCycleId" = t3.id
              WHERE t3."albumId" = al.id
                AND s2."cycleId" <= ${cycleId}
            )               AS "winNumber"
          FROM "StatsSnapshot" s
          JOIN "Track" tr               ON s."trackOfCycleId" = tr.id
          JOIN "Album" al               ON tr."albumId" = al.id
          WHERE s."cycleId" = ${cycleId}
          LIMIT 1
        ) album
      ) AS album,

      -- Artist of the Cycle: career nominations, and which number Artist of the
      -- Cycle win this one is.
      (
        SELECT row_to_json(artist)
        FROM (
          SELECT
            a.id            AS "artistId",
            a."name"        AS "name",
            a."imageUrl"    AS "imageUrl",
            (
              SELECT COUNT(*)
              FROM "Nomination" n
              JOIN "TrackToArtist" tta  ON tta."trackId" = n."trackId"
              WHERE tta."artistId" = a.id
                AND n."cycleId" <= ${cycleId}
            )               AS "nominations",
            (
              SELECT COUNT(*)
              FROM "StatsSnapshot" s2
              WHERE s2."artistOfCycleId" = a.id
                AND s2."cycleId" <= ${cycleId}
            )               AS "winNumber"
          FROM "StatsSnapshot" s
          JOIN "Artist" a               ON s."artistOfCycleId" = a.id
          WHERE s."cycleId" = ${cycleId}
          LIMIT 1
        ) artist
      ) AS artist,

      -- Who's new: artists in this cycle with no nomination in any earlier one.
      -- The aggregate always produces exactly one row, so an empty cycle comes
      -- back as zero counts and an empty list rather than NULL.
      (
        SELECT json_build_object(
          'totalArtists', COUNT(*),
          'count',        COUNT(*) FILTER (WHERE d."isDebut"),
          'artists',      COALESCE(
                            json_agg(
                              json_build_object(
                                'id',       d."artistId",
                                'name',     d."name",
                                'imageUrl', d."imageUrl"
                              )
                              ORDER BY d."name"
                            ) FILTER (WHERE d."isDebut"),
                            '[]'::json
                          )
        )
        FROM (
          SELECT
            a.id          AS "artistId",
            a."name"      AS "name",
            a."imageUrl"  AS "imageUrl",
            NOT EXISTS (
              SELECT 1
              FROM "Nomination" n2
              JOIN "TrackToArtist" tta2 ON tta2."trackId" = n2."trackId"
              WHERE tta2."artistId" = a.id
                AND n2."cycleId" < ${cycleId}
            )             AS "isDebut"
          FROM "Nomination" n
          JOIN "TrackToArtist" tta      ON tta."trackId" = n."trackId"
          JOIN "Artist" a               ON a.id = tta."artistId"
          WHERE n."cycleId" = ${cycleId}
          GROUP BY a.id, a."name", a."imageUrl"
        ) d
      ) AS debuts;
  `;

  if (!row?.cycleExists) return null;

  return {
    album: row?.album
      ? {
          ...row.album,
          songsNominated: Number(row.album.songsNominated),
          winNumber:      Number(row.album.winNumber),
        }
      : null,

    artist: row?.artist
      ? {
          ...row.artist,
          nominations: Number(row.artist.nominations),
          winNumber:   Number(row.artist.winNumber),
        }
      : null,

    debuts: row?.debuts ?? { totalArtists: 0, count: 0, artists: [] },
  };
}
