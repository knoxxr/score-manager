/*
  Warnings:

  - The primary key for the `Student` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ExamRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "examId" INTEGER NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentAnswers" TEXT NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "typeScores" TEXT NOT NULL,
    CONSTRAINT "ExamRecord_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExamRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ExamRecord" ("examId", "id", "studentAnswers", "studentId", "totalScore", "typeScores") SELECT "examId", "id", "studentAnswers", "studentId", "totalScore", "typeScores" FROM "ExamRecord";
DROP TABLE "ExamRecord";
ALTER TABLE "new_ExamRecord" RENAME TO "ExamRecord";
CREATE UNIQUE INDEX "ExamRecord_examId_studentId_key" ON "ExamRecord"("examId", "studentId");
CREATE TABLE "new_Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "class" TEXT NOT NULL DEFAULT '대시',
    "phoneNumber" TEXT NOT NULL,
    "schoolName" TEXT,
    "teacherId" INTEGER,
    CONSTRAINT "Student_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("class", "grade", "id", "name", "phoneNumber", "schoolName", "teacherId") SELECT "class", "grade", "id", "name", "phoneNumber", "schoolName", "teacherId" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
