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

        const allSQL = migrationSQL + phase2SQL + indexSQL
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
  } catch (error) {
    console.error("Failed to upgrade database:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
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
