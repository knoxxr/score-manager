-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Exam" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "class" TEXT NOT NULL DEFAULT '대시',
    "type" TEXT NOT NULL DEFAULT 'NORMAL',
    "date" DATETIME NOT NULL,
    "subjectInfo" TEXT NOT NULL
);
INSERT INTO "new_Exam" ("class", "date", "grade", "id", "name", "subjectInfo") SELECT "class", "date", "grade", "id", "name", "subjectInfo" FROM "Exam";
DROP TABLE "Exam";
ALTER TABLE "new_Exam" RENAME TO "Exam";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
