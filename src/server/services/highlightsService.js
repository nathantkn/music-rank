import db from '../db.js';

// Per-cycle context for the home hero. Everything is counted "as of" the given
// cycle — an older cycle's card shouldn't cite nominations or wins that only
// happened later, so every count is bounded by cycleId.

// The album behind Track of the Cycle: how deep this chart has drawn on it, and
// which number win this is for it.
async function albumHighlight(cycleId) {
  const rows = await db.$queryRaw`
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
    WHERE s."cycleId" = ${cycleId};
  `;

  const row = rows[0];
  if (!row) return null;

  return {
    albumId:        row.albumId,
    title:          row.title,
    imageUrl:       row.imageUrl,
    trackTitle:     row.trackTitle,
    songsNominated: Number(row.songsNominated),
    winNumber:      Number(row.winNumber),
  };
}

// Artist of the Cycle: career nominations, and which number Artist of the Cycle
// win this one is.
async function artistHighlight(cycleId) {
  const rows = await db.$queryRaw`
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
    WHERE s."cycleId" = ${cycleId};
  `;

  const row = rows[0];
  if (!row) return null;

  return {
    artistId:    row.artistId,
    name:        row.name,
    imageUrl:    row.imageUrl,
    nominations: Number(row.nominations),
    winNumber:   Number(row.winNumber),
  };
}

// Who's new: artists in this cycle with no nomination in any earlier one.
async function debutHighlight(cycleId) {
  const rows = await db.$queryRaw`
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
    ORDER BY a."name";
  `;

  const debuts = rows.filter(row => row.isDebut);

  return {
    totalArtists: rows.length,
    count:        debuts.length,
    artists:      debuts.map(row => ({
      id:       row.artistId,
      name:     row.name,
      imageUrl: row.imageUrl,
    })),
  };
}

// Sequential on purpose: DATABASE_URL points at a transaction pooler, and
// firing these raw queries concurrently trips PgBouncer's prepared-statement
// reuse (42P05 / 26000) and poisons the connection for later queries.
export async function computeCycleHighlights(cycleId) {
  const album = await albumHighlight(cycleId);
  const artist = await artistHighlight(cycleId);
  const debuts = await debutHighlight(cycleId);

  return { album, artist, debuts };
}
