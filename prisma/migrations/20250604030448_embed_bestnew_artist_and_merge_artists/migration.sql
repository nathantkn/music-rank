/*
  Warnings:

  - You are about to drop the `BestNewArtist` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `longestSongMs` on the `StatsSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `mostNominatedArtistId` on the `StatsSnapshot` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Track" ADD COLUMN "trackOfCycleId" INTEGER;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "BestNewArtist";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StatsSnapshot" (
    "cycleId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trackOfCycleId" INTEGER,
    "artistOfCycleId" INTEGER,
    "bestNewArtistId" INTEGER,
    "computedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StatsSnapshot_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StatsSnapshot_trackOfCycleId_fkey" FOREIGN KEY ("trackOfCycleId") REFERENCES "Track" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StatsSnapshot_artistOfCycleId_fkey" FOREIGN KEY ("artistOfCycleId") REFERENCES "Artist" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StatsSnapshot_bestNewArtistId_fkey" FOREIGN KEY ("bestNewArtistId") REFERENCES "Artist" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_StatsSnapshot" ("artistOfCycleId", "computedAt", "cycleId", "trackOfCycleId") SELECT "artistOfCycleId", "computedAt", "cycleId", "trackOfCycleId" FROM "StatsSnapshot";
DROP TABLE "StatsSnapshot";
ALTER TABLE "new_StatsSnapshot" RENAME TO "StatsSnapshot";
CREATE UNIQUE INDEX "StatsSnapshot_trackOfCycleId_key" ON "StatsSnapshot"("trackOfCycleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
