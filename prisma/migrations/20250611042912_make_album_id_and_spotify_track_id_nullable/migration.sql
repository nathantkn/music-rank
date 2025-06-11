-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Album" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "spotifyAlbumId" TEXT,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT
);
INSERT INTO "new_Album" ("id", "imageUrl", "spotifyAlbumId", "title") SELECT "id", "imageUrl", "spotifyAlbumId", "title" FROM "Album";
DROP TABLE "Album";
ALTER TABLE "new_Album" RENAME TO "Album";
CREATE UNIQUE INDEX "Album_spotifyAlbumId_key" ON "Album"("spotifyAlbumId");
CREATE TABLE "new_Track" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "spotifyTrackId" TEXT,
    "youtubeVideoId" TEXT,
    "title" TEXT NOT NULL,
    "durationMs" INTEGER,
    "albumId" INTEGER,
    CONSTRAINT "Track_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Track" ("albumId", "durationMs", "id", "spotifyTrackId", "title", "youtubeVideoId") SELECT "albumId", "durationMs", "id", "spotifyTrackId", "title", "youtubeVideoId" FROM "Track";
DROP TABLE "Track";
ALTER TABLE "new_Track" RENAME TO "Track";
CREATE UNIQUE INDEX "Track_spotifyTrackId_key" ON "Track"("spotifyTrackId");
CREATE UNIQUE INDEX "Track_youtubeVideoId_key" ON "Track"("youtubeVideoId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
