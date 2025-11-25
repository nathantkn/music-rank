-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Cycle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Cycle" ("id", "isActive", "name") SELECT "id", "isActive", "name" FROM "Cycle";
DROP TABLE "Cycle";
ALTER TABLE "new_Cycle" RENAME TO "Cycle";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
