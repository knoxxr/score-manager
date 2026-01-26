/*
  Warnings:

  - You are about to drop the column `class` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `grade` on the `Teacher` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "TeacherAssignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "teacherId" INTEGER NOT NULL,
    "grade" INTEGER NOT NULL,
    "class" TEXT NOT NULL,
    CONSTRAINT "TeacherAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Teacher" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);
INSERT INTO "new_Teacher" ("id", "name") SELECT "id", "name" FROM "Teacher";
DROP TABLE "Teacher";
ALTER TABLE "new_Teacher" RENAME TO "Teacher";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "TeacherAssignment_grade_class_key" ON "TeacherAssignment"("grade", "class");
