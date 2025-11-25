/*
  Warnings:

  - You are about to drop the column `trackOfCycleId` on the `Track` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Track" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "spotifyTrackId" TEXT NOT NULL,
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
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
