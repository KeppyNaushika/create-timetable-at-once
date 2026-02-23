import { PrismaClient } from "@prisma/client"
import * as fs from "fs/promises"
import * as path from "path"

import { getDataDirectory } from "../dataManager"

export const getDatabasePath = (): string => {
  return path.join(getDataDirectory(), "database.db")
}

export const createSharedPrismaClient = (): PrismaClient => {
  const databasePath = getDatabasePath()
  const absolutePath = path.resolve(databasePath)
  const normalizedPath = absolutePath.replace(/\\/g, "/")
  const databaseUrl = `file:${normalizedPath}`

  process.env.DATABASE_URL = databaseUrl

  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: ["error", "warn"],
    errorFormat: "pretty",
  })
}

export const initializeDatabase = async (): Promise<boolean> => {
  try {
    const dbExists = await checkDatabaseExists()

    if (!dbExists) {
      const dataDir = getDataDirectory()
      await fs.mkdir(dataDir, { recursive: true, mode: 0o755 })

      const dbPath = getDatabasePath()
      await fs.writeFile(dbPath, "", { mode: 0o644 })

      const prisma = createSharedPrismaClient()

      try {
        await prisma.$connect()

        const migrationSQL = `
CREATE TABLE "School" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT '',
    "academicYear" INTEGER NOT NULL DEFAULT 2025,
    "classCountsJson" TEXT NOT NULL DEFAULT '{}',
    "namingConvention" TEXT NOT NULL DEFAULT 'number',
    "daysPerWeek" INTEGER NOT NULL DEFAULT 5,
    "maxPeriodsPerDay" INTEGER NOT NULL DEFAULT 6,
    "hasZeroPeriod" BOOLEAN NOT NULL DEFAULT false,
    "periodNamesJson" TEXT NOT NULL DEFAULT '[]',
    "periodLengthsJson" TEXT NOT NULL DEFAULT '[]',
    "lunchAfterPeriod" INTEGER NOT NULL DEFAULT 4,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "Grade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gradeNum" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "Class" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gradeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Class_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameKana" TEXT NOT NULL DEFAULT '',
    "mainSubjectId" TEXT,
    "maxConsecutive" INTEGER NOT NULL DEFAULT 6,
    "maxPerDay" INTEGER NOT NULL DEFAULT 6,
    "maxPeriodsPerWeek" INTEGER NOT NULL DEFAULT 25,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "TeacherAvailability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeacherAvailability_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Subject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL DEFAULT '',
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "category" TEXT NOT NULL DEFAULT 'general',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
        `

        const phase2SQL = `
CREATE TABLE "SpecialRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL DEFAULT '',
    "capacity" INTEGER NOT NULL DEFAULT 40,
    "notes" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "RoomAvailability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RoomAvailability_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "SpecialRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Duty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL DEFAULT '',
    "dayOfWeek" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "TeacherDuty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dutyId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeacherDuty_dutyId_fkey" FOREIGN KEY ("dutyId") REFERENCES "Duty" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeacherDuty_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Koma" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subjectId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'normal',
    "count" INTEGER NOT NULL DEFAULT 1,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "label" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Koma_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Koma_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "KomaTeacher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "komaId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'main',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KomaTeacher_komaId_fkey" FOREIGN KEY ("komaId") REFERENCES "Koma" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KomaTeacher_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "KomaClass" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "komaId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KomaClass_komaId_fkey" FOREIGN KEY ("komaId") REFERENCES "Koma" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KomaClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "KomaRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "komaId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KomaRoom_komaId_fkey" FOREIGN KEY ("komaId") REFERENCES "Koma" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KomaRoom_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "SpecialRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
        `

        const indexSQL = `
CREATE UNIQUE INDEX "Grade_gradeNum_key" ON "Grade"("gradeNum");
CREATE UNIQUE INDEX "Class_gradeId_name_key" ON "Class"("gradeId", "name");
CREATE INDEX "Class_gradeId_idx" ON "Class"("gradeId");
CREATE UNIQUE INDEX "TeacherAvailability_teacherId_dayOfWeek_period_key" ON "TeacherAvailability"("teacherId", "dayOfWeek", "period");
CREATE INDEX "TeacherAvailability_teacherId_idx" ON "TeacherAvailability"("teacherId");
CREATE UNIQUE INDEX "Subject_name_key" ON "Subject"("name");
CREATE UNIQUE INDEX "RoomAvailability_roomId_dayOfWeek_period_key" ON "RoomAvailability"("roomId", "dayOfWeek", "period");
CREATE INDEX "RoomAvailability_roomId_idx" ON "RoomAvailability"("roomId");
CREATE UNIQUE INDEX "TeacherDuty_dutyId_teacherId_key" ON "TeacherDuty"("dutyId", "teacherId");
CREATE INDEX "TeacherDuty_dutyId_idx" ON "TeacherDuty"("dutyId");
CREATE INDEX "TeacherDuty_teacherId_idx" ON "TeacherDuty"("teacherId");
CREATE INDEX "Koma_subjectId_idx" ON "Koma"("subjectId");
CREATE INDEX "Koma_gradeId_idx" ON "Koma"("gradeId");
CREATE UNIQUE INDEX "KomaTeacher_komaId_teacherId_key" ON "KomaTeacher"("komaId", "teacherId");
CREATE INDEX "KomaTeacher_komaId_idx" ON "KomaTeacher"("komaId");
CREATE INDEX "KomaTeacher_teacherId_idx" ON "KomaTeacher"("teacherId");
CREATE UNIQUE INDEX "KomaClass_komaId_classId_key" ON "KomaClass"("komaId", "classId");
CREATE INDEX "KomaClass_komaId_idx" ON "KomaClass"("komaId");
CREATE INDEX "KomaClass_classId_idx" ON "KomaClass"("classId");
CREATE UNIQUE INDEX "KomaRoom_komaId_roomId_key" ON "KomaRoom"("komaId", "roomId");
CREATE INDEX "KomaRoom_komaId_idx" ON "KomaRoom"("komaId");
CREATE INDEX "KomaRoom_roomId_idx" ON "KomaRoom"("roomId");
        `

        const phase3SQL = `
CREATE TABLE "ScheduleCondition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherAvailability" TEXT NOT NULL DEFAULT 'forbidden',
    "teacherAvailabilityWeight" INTEGER NOT NULL DEFAULT 100,
    "teacherMaxPerDay" TEXT NOT NULL DEFAULT 'consider',
    "teacherMaxPerDayWeight" INTEGER NOT NULL DEFAULT 80,
    "teacherMaxConsecutive" TEXT NOT NULL DEFAULT 'consider',
    "teacherMaxConsecutiveWeight" INTEGER NOT NULL DEFAULT 80,
    "teacherMaxPerWeek" TEXT NOT NULL DEFAULT 'consider',
    "teacherMaxPerWeekWeight" INTEGER NOT NULL DEFAULT 60,
    "classSameSubjectPerDay" TEXT NOT NULL DEFAULT 'consider',
    "classSameSubjectPerDayWeight" INTEGER NOT NULL DEFAULT 70,
    "classConsecutiveSame" TEXT NOT NULL DEFAULT 'ignore',
    "classConsecutiveSameWeight" INTEGER NOT NULL DEFAULT 50,
    "roomConflict" TEXT NOT NULL DEFAULT 'forbidden',
    "roomConflictWeight" INTEGER NOT NULL DEFAULT 100,
    "roomAvailability" TEXT NOT NULL DEFAULT 'forbidden',
    "roomAvailabilityWeight" INTEGER NOT NULL DEFAULT 100,
    "dutyConflict" TEXT NOT NULL DEFAULT 'forbidden',
    "dutyConflictWeight" INTEGER NOT NULL DEFAULT 100,
    "consecutiveKoma" TEXT NOT NULL DEFAULT 'consider',
    "consecutiveKomaWeight" INTEGER NOT NULL DEFAULT 90,
    "dailyBalance" TEXT NOT NULL DEFAULT 'consider',
    "dailyBalanceWeight" INTEGER NOT NULL DEFAULT 40,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "PerSubjectCondition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conditionId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "placementRestriction" TEXT NOT NULL DEFAULT 'any',
    "maxPerDay" INTEGER NOT NULL DEFAULT 2,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PerSubjectCondition_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "ScheduleCondition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "TimetablePattern" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "violationCount" INTEGER NOT NULL DEFAULT 0,
    "score" REAL NOT NULL DEFAULT 0,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "TimetableSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patternId" TEXT NOT NULL,
    "komaId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,
    "placedBy" TEXT NOT NULL DEFAULT 'auto',
    "isFixed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TimetableSlot_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "TimetablePattern" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
        `

        const phase3IndexSQL = `
CREATE UNIQUE INDEX "PerSubjectCondition_conditionId_subjectId_key" ON "PerSubjectCondition"("conditionId", "subjectId");
CREATE INDEX "PerSubjectCondition_conditionId_idx" ON "PerSubjectCondition"("conditionId");
CREATE INDEX "TimetableSlot_patternId_idx" ON "TimetableSlot"("patternId");
CREATE INDEX "TimetableSlot_komaId_idx" ON "TimetableSlot"("komaId");
CREATE INDEX "TimetableSlot_patternId_dayOfWeek_period_idx" ON "TimetableSlot"("patternId", "dayOfWeek", "period");
CREATE UNIQUE INDEX "TimetableSlot_patternId_komaId_dayOfWeek_period_key" ON "TimetableSlot"("patternId", "komaId", "dayOfWeek", "period");
        `

        const phase5SQL = `
CREATE TABLE "DailySchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "scheduleType" TEXT NOT NULL DEFAULT 'normal',
    "periodsCount" INTEGER,
    "reason" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "DailyChange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dailyScheduleId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "period" INTEGER NOT NULL,
    "changeType" TEXT NOT NULL,
    "originalKomaId" TEXT,
    "substituteTeacherId" TEXT,
    "rescheduleDate" TEXT,
    "reschedulePeriod" INTEGER,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyChange_dailyScheduleId_fkey" FOREIGN KEY ("dailyScheduleId") REFERENCES "DailySchedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "SchoolEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isAllDay" BOOLEAN NOT NULL DEFAULT true,
    "affectedPeriods" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "ExamSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "subjectsJson" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "ExamAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examScheduleId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "period" INTEGER NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL DEFAULT 'auto',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExamAssignment_examScheduleId_fkey" FOREIGN KEY ("examScheduleId") REFERENCES "ExamSchedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
        `

        const phase5IndexSQL = `
CREATE UNIQUE INDEX "DailySchedule_date_key" ON "DailySchedule"("date");
CREATE UNIQUE INDEX "DailyChange_dailyScheduleId_classId_period_key" ON "DailyChange"("dailyScheduleId", "classId", "period");
CREATE INDEX "DailyChange_dailyScheduleId_idx" ON "DailyChange"("dailyScheduleId");
CREATE INDEX "DailyChange_classId_idx" ON "DailyChange"("classId");
CREATE INDEX "SchoolEvent_date_idx" ON "SchoolEvent"("date");
CREATE INDEX "SchoolEvent_eventType_idx" ON "SchoolEvent"("eventType");
CREATE UNIQUE INDEX "ExamAssignment_examScheduleId_date_period_classId_key" ON "ExamAssignment"("examScheduleId", "date", "period", "classId");
CREATE INDEX "ExamAssignment_examScheduleId_idx" ON "ExamAssignment"("examScheduleId");
CREATE INDEX "ExamAssignment_supervisorId_idx" ON "ExamAssignment"("supervisorId");
CREATE UNIQUE INDEX "AppSetting_key_key" ON "AppSetting"("key");
        `

        const allSQL =
          migrationSQL + phase2SQL + indexSQL + phase3SQL + phase3IndexSQL + phase5SQL + phase5IndexSQL
        const statements = allSQL.split(";").filter((stmt) => stmt.trim())

        for (const statement of statements) {
          if (statement.trim()) {
            await prisma.$executeRawUnsafe(statement.trim())
          }
        }

        return true
      } catch (error) {
        console.error("Failed to initialize database schema:", error)
        try {
          await fs.unlink(dbPath)
        } catch {
          // ignore
        }
        throw error
      } finally {
        await prisma.$disconnect()
      }
    } else {
      return false
    }
  } catch (error) {
    console.error("Database initialization failed:", error)
    throw error
  }
}

export const upgradeDatabase = async (): Promise<void> => {
  const prisma = createSharedPrismaClient()
  try {
    await prisma.$connect()

    // Phase 2 テーブルが存在するかチェック
    const tables = await prisma.$queryRawUnsafe<{ name: string }[]>(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='SpecialRoom'`
    )

    if (tables.length > 0) {
      // Phase 2 テーブルは存在するが、Teacher に新カラムがあるかチェック
      try {
        await prisma.$queryRawUnsafe(
          `SELECT "maxConsecutive" FROM "Teacher" LIMIT 1`
        )
      } catch {
        // カラムが存在しない場合は追加
        await prisma.$executeRawUnsafe(
          `ALTER TABLE "Teacher" ADD COLUMN "maxConsecutive" INTEGER NOT NULL DEFAULT 6`
        )
        await prisma.$executeRawUnsafe(
          `ALTER TABLE "Teacher" ADD COLUMN "maxPerDay" INTEGER NOT NULL DEFAULT 6`
        )
        console.log("Added maxConsecutive and maxPerDay columns to Teacher")
      }
      // Phase 3 アップグレードもチェック
      await upgradeToPhase3(prisma)
      return
    }

    const phase2SQL = `
CREATE TABLE "SpecialRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL DEFAULT '',
    "capacity" INTEGER NOT NULL DEFAULT 40,
    "notes" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "RoomAvailability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RoomAvailability_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "SpecialRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Duty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL DEFAULT '',
    "dayOfWeek" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "TeacherDuty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dutyId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeacherDuty_dutyId_fkey" FOREIGN KEY ("dutyId") REFERENCES "Duty" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeacherDuty_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Koma" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subjectId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'normal',
    "count" INTEGER NOT NULL DEFAULT 1,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "label" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Koma_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Koma_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "KomaTeacher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "komaId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'main',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KomaTeacher_komaId_fkey" FOREIGN KEY ("komaId") REFERENCES "Koma" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KomaTeacher_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "KomaClass" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "komaId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KomaClass_komaId_fkey" FOREIGN KEY ("komaId") REFERENCES "Koma" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KomaClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "KomaRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "komaId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KomaRoom_komaId_fkey" FOREIGN KEY ("komaId") REFERENCES "Koma" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KomaRoom_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "SpecialRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
    `

    const phase2IndexSQL = `
CREATE UNIQUE INDEX "RoomAvailability_roomId_dayOfWeek_period_key" ON "RoomAvailability"("roomId", "dayOfWeek", "period");
CREATE INDEX "RoomAvailability_roomId_idx" ON "RoomAvailability"("roomId");
CREATE UNIQUE INDEX "TeacherDuty_dutyId_teacherId_key" ON "TeacherDuty"("dutyId", "teacherId");
CREATE INDEX "TeacherDuty_dutyId_idx" ON "TeacherDuty"("dutyId");
CREATE INDEX "TeacherDuty_teacherId_idx" ON "TeacherDuty"("teacherId");
CREATE INDEX "Koma_subjectId_idx" ON "Koma"("subjectId");
CREATE INDEX "Koma_gradeId_idx" ON "Koma"("gradeId");
CREATE UNIQUE INDEX "KomaTeacher_komaId_teacherId_key" ON "KomaTeacher"("komaId", "teacherId");
CREATE INDEX "KomaTeacher_komaId_idx" ON "KomaTeacher"("komaId");
CREATE INDEX "KomaTeacher_teacherId_idx" ON "KomaTeacher"("teacherId");
CREATE UNIQUE INDEX "KomaClass_komaId_classId_key" ON "KomaClass"("komaId", "classId");
CREATE INDEX "KomaClass_komaId_idx" ON "KomaClass"("komaId");
CREATE INDEX "KomaClass_classId_idx" ON "KomaClass"("classId");
CREATE UNIQUE INDEX "KomaRoom_komaId_roomId_key" ON "KomaRoom"("komaId", "roomId");
CREATE INDEX "KomaRoom_komaId_idx" ON "KomaRoom"("komaId");
CREATE INDEX "KomaRoom_roomId_idx" ON "KomaRoom"("roomId");
    `

    const allSQL = phase2SQL + phase2IndexSQL
    const statements = allSQL.split(";").filter((stmt) => stmt.trim())

    for (const statement of statements) {
      if (statement.trim()) {
        await prisma.$executeRawUnsafe(statement.trim())
      }
    }

    console.log("Database upgraded to Phase 2 successfully")

    // Phase 3 アップグレードもチェック
    await upgradeToPhase3(prisma)
  } catch (error) {
    console.error("Failed to upgrade database:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function upgradeToPhase3(prisma: PrismaClient): Promise<void> {
  const tables = await prisma.$queryRawUnsafe<{ name: string }[]>(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='ScheduleCondition'`
  )

  if (tables.length > 0) return

  const phase3SQL = `
CREATE TABLE "ScheduleCondition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherAvailability" TEXT NOT NULL DEFAULT 'forbidden',
    "teacherAvailabilityWeight" INTEGER NOT NULL DEFAULT 100,
    "teacherMaxPerDay" TEXT NOT NULL DEFAULT 'consider',
    "teacherMaxPerDayWeight" INTEGER NOT NULL DEFAULT 80,
    "teacherMaxConsecutive" TEXT NOT NULL DEFAULT 'consider',
    "teacherMaxConsecutiveWeight" INTEGER NOT NULL DEFAULT 80,
    "teacherMaxPerWeek" TEXT NOT NULL DEFAULT 'consider',
    "teacherMaxPerWeekWeight" INTEGER NOT NULL DEFAULT 60,
    "classSameSubjectPerDay" TEXT NOT NULL DEFAULT 'consider',
    "classSameSubjectPerDayWeight" INTEGER NOT NULL DEFAULT 70,
    "classConsecutiveSame" TEXT NOT NULL DEFAULT 'ignore',
    "classConsecutiveSameWeight" INTEGER NOT NULL DEFAULT 50,
    "roomConflict" TEXT NOT NULL DEFAULT 'forbidden',
    "roomConflictWeight" INTEGER NOT NULL DEFAULT 100,
    "roomAvailability" TEXT NOT NULL DEFAULT 'forbidden',
    "roomAvailabilityWeight" INTEGER NOT NULL DEFAULT 100,
    "dutyConflict" TEXT NOT NULL DEFAULT 'forbidden',
    "dutyConflictWeight" INTEGER NOT NULL DEFAULT 100,
    "consecutiveKoma" TEXT NOT NULL DEFAULT 'consider',
    "consecutiveKomaWeight" INTEGER NOT NULL DEFAULT 90,
    "dailyBalance" TEXT NOT NULL DEFAULT 'consider',
    "dailyBalanceWeight" INTEGER NOT NULL DEFAULT 40,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "PerSubjectCondition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conditionId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "placementRestriction" TEXT NOT NULL DEFAULT 'any',
    "maxPerDay" INTEGER NOT NULL DEFAULT 2,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PerSubjectCondition_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "ScheduleCondition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "TimetablePattern" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "violationCount" INTEGER NOT NULL DEFAULT 0,
    "score" REAL NOT NULL DEFAULT 0,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "TimetableSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patternId" TEXT NOT NULL,
    "komaId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,
    "placedBy" TEXT NOT NULL DEFAULT 'auto',
    "isFixed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TimetableSlot_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "TimetablePattern" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
  `

  const phase3IndexSQL = `
CREATE UNIQUE INDEX "PerSubjectCondition_conditionId_subjectId_key" ON "PerSubjectCondition"("conditionId", "subjectId");
CREATE INDEX "PerSubjectCondition_conditionId_idx" ON "PerSubjectCondition"("conditionId");
CREATE INDEX "TimetableSlot_patternId_idx" ON "TimetableSlot"("patternId");
CREATE INDEX "TimetableSlot_komaId_idx" ON "TimetableSlot"("komaId");
CREATE INDEX "TimetableSlot_patternId_dayOfWeek_period_idx" ON "TimetableSlot"("patternId", "dayOfWeek", "period");
CREATE UNIQUE INDEX "TimetableSlot_patternId_komaId_dayOfWeek_period_key" ON "TimetableSlot"("patternId", "komaId", "dayOfWeek", "period");
  `

  const allSQL = phase3SQL + phase3IndexSQL
  const statements = allSQL.split(";").filter((stmt) => stmt.trim())

  for (const statement of statements) {
    if (statement.trim()) {
      await prisma.$executeRawUnsafe(statement.trim())
    }
  }

  console.log("Database upgraded to Phase 3 successfully")

  await upgradeToPhase5(prisma)
}

async function upgradeToPhase5(prisma: PrismaClient): Promise<void> {
  const tables = await prisma.$queryRawUnsafe<{ name: string }[]>(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='DailySchedule'`
  )

  if (tables.length > 0) return

  const phase5SQL = `
CREATE TABLE "DailySchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "scheduleType" TEXT NOT NULL DEFAULT 'normal',
    "periodsCount" INTEGER,
    "reason" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "DailyChange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dailyScheduleId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "period" INTEGER NOT NULL,
    "changeType" TEXT NOT NULL,
    "originalKomaId" TEXT,
    "substituteTeacherId" TEXT,
    "rescheduleDate" TEXT,
    "reschedulePeriod" INTEGER,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyChange_dailyScheduleId_fkey" FOREIGN KEY ("dailyScheduleId") REFERENCES "DailySchedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "SchoolEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isAllDay" BOOLEAN NOT NULL DEFAULT true,
    "affectedPeriods" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "ExamSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "subjectsJson" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "ExamAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examScheduleId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "period" INTEGER NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL DEFAULT 'auto',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExamAssignment_examScheduleId_fkey" FOREIGN KEY ("examScheduleId") REFERENCES "ExamSchedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
  `

  const phase5IndexSQL = `
CREATE UNIQUE INDEX "DailySchedule_date_key" ON "DailySchedule"("date");
CREATE UNIQUE INDEX "DailyChange_dailyScheduleId_classId_period_key" ON "DailyChange"("dailyScheduleId", "classId", "period");
CREATE INDEX "DailyChange_dailyScheduleId_idx" ON "DailyChange"("dailyScheduleId");
CREATE INDEX "DailyChange_classId_idx" ON "DailyChange"("classId");
CREATE INDEX "SchoolEvent_date_idx" ON "SchoolEvent"("date");
CREATE INDEX "SchoolEvent_eventType_idx" ON "SchoolEvent"("eventType");
CREATE UNIQUE INDEX "ExamAssignment_examScheduleId_date_period_classId_key" ON "ExamAssignment"("examScheduleId", "date", "period", "classId");
CREATE INDEX "ExamAssignment_examScheduleId_idx" ON "ExamAssignment"("examScheduleId");
CREATE INDEX "ExamAssignment_supervisorId_idx" ON "ExamAssignment"("supervisorId");
CREATE UNIQUE INDEX "AppSetting_key_key" ON "AppSetting"("key");
  `

  const allSQL = phase5SQL + phase5IndexSQL
  const statements = allSQL.split(";").filter((stmt) => stmt.trim())

  for (const statement of statements) {
    if (statement.trim()) {
      await prisma.$executeRawUnsafe(statement.trim())
    }
  }

  console.log("Database upgraded to Phase 5/6 successfully")
}

export const checkDatabaseExists = async (): Promise<boolean> => {
  try {
    await fs.access(getDatabasePath())
    return true
  } catch {
    return false
  }
}

export const checkDatabaseHealth = async (): Promise<boolean> => {
  const prisma = createSharedPrismaClient()

  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error("Database health check failed:", error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

export const optimizeDatabaseForSharedDrive = async (): Promise<void> => {
  const prisma = createSharedPrismaClient()

  try {
    await prisma.$queryRaw`PRAGMA journal_mode = WAL`
    await prisma.$queryRaw`PRAGMA busy_timeout = 30000`
    await prisma.$queryRaw`PRAGMA synchronous = NORMAL`
    await prisma.$queryRaw`PRAGMA cache_size = -64000`
  } catch (error) {
    console.error("Failed to optimize database:", error)
  } finally {
    await prisma.$disconnect()
  }
}
