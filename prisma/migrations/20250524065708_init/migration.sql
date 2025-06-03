-- CreateTable
CREATE TABLE "Cycle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Artist" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "spotifyArtistId" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Album" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "spotifyAlbumId" TEXT NOT NULL,
    "title" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Track" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "spotifyTrackId" TEXT NOT NULL,
    "youtubeVideoId" TEXT,
    "title" TEXT NOT NULL,
    "durationMs" INTEGER,
    "artistId" INTEGER,
    "albumId" INTEGER,
    CONSTRAINT "Track_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Track_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Nomination" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cycleId" INTEGER NOT NULL,
    "trackId" INTEGER NOT NULL,
    "rank" INTEGER,
    CONSTRAINT "Nomination_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Nomination_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BestNewArtist" (
    "cycleId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "artistId" INTEGER NOT NULL,
    CONSTRAINT "BestNewArtist_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BestNewArtist_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StatsSnapshot" (
    "cycleId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trackOfCycleId" INTEGER,
    "artistOfCycleId" INTEGER,
    "mostNominatedArtistId" INTEGER,
    "longestSongMs" INTEGER,
    "computedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StatsSnapshot_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StatsSnapshot_trackOfCycleId_fkey" FOREIGN KEY ("trackOfCycleId") REFERENCES "Track" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StatsSnapshot_artistOfCycleId_fkey" FOREIGN KEY ("artistOfCycleId") REFERENCES "Artist" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StatsSnapshot_mostNominatedArtistId_fkey" FOREIGN KEY ("mostNominatedArtistId") REFERENCES "Artist" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Artist_spotifyArtistId_key" ON "Artist"("spotifyArtistId");

-- CreateIndex
CREATE UNIQUE INDEX "Album_spotifyAlbumId_key" ON "Album"("spotifyAlbumId");

-- CreateIndex
CREATE UNIQUE INDEX "Track_spotifyTrackId_key" ON "Track"("spotifyTrackId");

-- CreateIndex
CREATE UNIQUE INDEX "Nomination_cycleId_trackId_key" ON "Nomination"("cycleId", "trackId");

-- CreateIndex
CREATE UNIQUE INDEX "StatsSnapshot_trackOfCycleId_key" ON "StatsSnapshot"("trackOfCycleId");
