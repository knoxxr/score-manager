-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ExamRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "examId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
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
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
