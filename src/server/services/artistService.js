import db from '../db.js';

// Everything an artist profile needs, and the directory that lists them.
//
// Both functions are a single statement each, for the same reason
// computeCycleHighlights is: DATABASE_URL points at a transaction pooler, so
// parallel raw queries trip PgBouncer's prepared-statement reuse (42P05 /
// 26000) and poison the connection, and sequential awaits each cost a ~230ms
// round trip against hosted Postgres — far more than the queries themselves.
//
// Award semantics match the leaderboards exactly:
//   Track of the Cycle  — credited to every artist on the winning track, so a
//                         feature counts the same as a lead credit.
//   Artist of the Cycle — StatsSnapshot.artistOfCycleId (derived).
//   Best New Artist     — StatsSnapshot.bestNewArtistId (hand-picked).

/**
 * Career profile for one artist: totals, award counts, and every nomination
 * grouped by the cycle it belongs to, newest cycle first.
 *
 * Returns null when the artist doesn't exist, so the route can 404 without
 * spending a separate existence check. An artist who exists but has had all
 * their nominations deleted comes back with zeroes and an empty timeline.
 *
 * @param {number} artistId
 */
export async function computeArtistProfile(artistId) {
  const [row] = await db.$queryRaw`
    SELECT
      EXISTS (SELECT 1 FROM "Artist" WHERE id = ${artistId}) AS "artistExists",

      (
        SELECT row_to_json(a)
        FROM (
          SELECT
            "id",
            "name",
            "imageUrl",
            "spotifyArtistId"
          FROM "Artist"
          WHERE id = ${artistId}
        ) a
      ) AS artist,

      -- Career totals. bestRank ignores unranked nominations on its own — MIN
      -- skips NULLs — so an artist with nothing ranked yet reports null rather
      -- than a bogus position.
      (
        SELECT json_build_object(
          'nominations',    COUNT(*)::int,
          'cyclesAppeared', COUNT(DISTINCT n."cycleId")::int,
          'bestRank',       MIN(n."rank")
        )
        FROM "Nomination" n
        JOIN "TrackToArtist" tta      ON tta."trackId" = n."trackId"
        WHERE tta."artistId" = ${artistId}
      ) AS totals,

      json_build_object(
        'trackOfCycle', (
          SELECT COUNT(*)::int
          FROM "StatsSnapshot" s
          JOIN "TrackToArtist" tta    ON tta."trackId" = s."trackOfCycleId"
          WHERE tta."artistId" = ${artistId}
        ),
        'artistOfCycle', (
          SELECT COUNT(*)::int
          FROM "StatsSnapshot" s
          WHERE s."artistOfCycleId" = ${artistId}
        ),
        'bestNewArtist', (
          SELECT COUNT(*)::int
          FROM "StatsSnapshot" s
          WHERE s."bestNewArtistId" = ${artistId}
        )
      ) AS awards,

      -- The timeline. Cycles are selected by the union of "has a nomination
      -- here" and "won something here" — Best New Artist is hand-picked, so a
      -- winner whose nomination was later deleted would otherwise drop out of
      -- their own history.
      (
        SELECT COALESCE(
          json_agg(
            json_build_object(
              'cycleId',   c.id,
              'cycleName', c."name",
              'isActive',  c."isActive",
              'awards', json_build_object(
                'trackOfCycle', EXISTS (
                  SELECT 1
                  FROM "StatsSnapshot" s
                  JOIN "TrackToArtist" tta ON tta."trackId" = s."trackOfCycleId"
                  WHERE s."cycleId" = c.id AND tta."artistId" = ${artistId}
                ),
                'artistOfCycle', EXISTS (
                  SELECT 1 FROM "StatsSnapshot" s
                  WHERE s."cycleId" = c.id AND s."artistOfCycleId" = ${artistId}
                ),
                'bestNewArtist', EXISTS (
                  SELECT 1 FROM "StatsSnapshot" s
                  WHERE s."cycleId" = c.id AND s."bestNewArtistId" = ${artistId}
                )
              ),
              'nominations', COALESCE((
                SELECT json_agg(
                  json_build_object(
                    'nominationId',  n.id,
                    'rank',          n."rank",
                    'trackId',       tr.id,
                    'title',         tr."title",
                    'albumTitle',    al."title",
                    'albumImageUrl', al."imageUrl",
                    -- Everyone else on the track, so a feature reads as one.
                    'coArtists', COALESCE((
                      SELECT json_agg(
                        json_build_object('id', a2.id, 'name', a2."name")
                        ORDER BY a2."name"
                      )
                      FROM "TrackToArtist" tta2
                      JOIN "Artist" a2      ON a2.id = tta2."artistId"
                      WHERE tta2."trackId" = tr.id
                        AND tta2."artistId" <> ${artistId}
                    ), '[]'::json)
                  )
                  -- Unranked nominations have no position and sort last, the
                  -- same way the chart treats them.
                  ORDER BY n."rank" ASC NULLS LAST, tr."title" ASC
                )
                FROM "Nomination" n
                JOIN "Track" tr             ON tr.id = n."trackId"
                JOIN "TrackToArtist" tta    ON tta."trackId" = tr.id
                LEFT JOIN "Album" al        ON al.id = tr."albumId"
                WHERE n."cycleId" = c.id
                  AND tta."artistId" = ${artistId}
              ), '[]'::json)
            )
            ORDER BY c.id DESC
          ),
          '[]'::json
        )
        FROM "Cycle" c
        WHERE EXISTS (
            SELECT 1
            FROM "Nomination" n
            JOIN "TrackToArtist" tta ON tta."trackId" = n."trackId"
            WHERE n."cycleId" = c.id AND tta."artistId" = ${artistId}
          )
          OR EXISTS (
            SELECT 1
            FROM "StatsSnapshot" s
            LEFT JOIN "TrackToArtist" tta ON tta."trackId" = s."trackOfCycleId"
            WHERE s."cycleId" = c.id
              AND (
                s."artistOfCycleId" = ${artistId}
                OR s."bestNewArtistId" = ${artistId}
                OR tta."artistId" = ${artistId}
              )
          )
      ) AS cycles;
  `;

  if (!row?.artistExists) return null;

  return {
    artist: row.artist,
    totals: row.totals,
    awards: row.awards,
    cycles: row.cycles ?? [],
  };
}

/**
 * Every artist who has ever been nominated, with the counts the directory
 * cards show. Deleting a nomination drops the track and its artist links but
 * never the Artist row, so the join through Nomination is what keeps orphaned
 * artists out of the grid.
 */
export async function computeArtistDirectory() {
  const results = await db.$queryRaw`
    SELECT
      a.id                                AS "id",
      a."name"                            AS "name",
      a."imageUrl"                        AS "imageUrl",
      COUNT(DISTINCT n.id)::int           AS "nominations",
      COUNT(DISTINCT n."cycleId")::int    AS "cyclesAppeared",

      -- Broken out by award rather than pre-summed, so the directory can filter
      -- to one award's winners without a second query. "wins" is still the
      -- total, because that's what the card and the sort want.
      (SELECT COUNT(*)
         FROM "StatsSnapshot" s
         JOIN "TrackToArtist" tta2 ON tta2."trackId" = s."trackOfCycleId"
        WHERE tta2."artistId" = a.id)::int                                            AS "trackOfCycle",
      (SELECT COUNT(*) FROM "StatsSnapshot" s WHERE s."artistOfCycleId" = a.id)::int  AS "artistOfCycle",
      (SELECT COUNT(*) FROM "StatsSnapshot" s WHERE s."bestNewArtistId" = a.id)::int  AS "bestNewArtist",
      (
          (SELECT COUNT(*)
             FROM "StatsSnapshot" s
             JOIN "TrackToArtist" tta2 ON tta2."trackId" = s."trackOfCycleId"
            WHERE tta2."artistId" = a.id)
        + (SELECT COUNT(*) FROM "StatsSnapshot" s WHERE s."artistOfCycleId" = a.id)
        + (SELECT COUNT(*) FROM "StatsSnapshot" s WHERE s."bestNewArtistId" = a.id)
      )::int                              AS "wins"
    FROM "Artist" a
    JOIN "TrackToArtist" tta  ON tta."artistId" = a.id
    JOIN "Nomination" n       ON n."trackId" = tta."trackId"
    GROUP BY a.id, a."name", a."imageUrl"
    ORDER BY "nominations" DESC, a."name" ASC;
  `;

  return results;
}
