-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Student" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "class" TEXT NOT NULL DEFAULT '대시',
    "phoneNumber" TEXT NOT NULL,
    "teacherId" INTEGER,
    CONSTRAINT "Student_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("grade", "id", "name", "phoneNumber", "teacherId") SELECT "grade", "id", "name", "phoneNumber", "teacherId" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE TABLE "new_Teacher" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "class" TEXT NOT NULL DEFAULT '대시'
);
INSERT INTO "new_Teacher" ("grade", "id", "name") SELECT "grade", "id", "name" FROM "Teacher";
DROP TABLE "Teacher";
ALTER TABLE "new_Teacher" RENAME TO "Teacher";
CREATE UNIQUE INDEX "Teacher_grade_class_key" ON "Teacher"("grade", "class");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
