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

        const indexSQL = `
CREATE UNIQUE INDEX "Grade_gradeNum_key" ON "Grade"("gradeNum");
CREATE UNIQUE INDEX "Class_gradeId_name_key" ON "Class"("gradeId", "name");
CREATE INDEX "Class_gradeId_idx" ON "Class"("gradeId");
CREATE UNIQUE INDEX "TeacherAvailability_teacherId_dayOfWeek_period_key" ON "TeacherAvailability"("teacherId", "dayOfWeek", "period");
CREATE INDEX "TeacherAvailability_teacherId_idx" ON "TeacherAvailability"("teacherId");
CREATE UNIQUE INDEX "Subject_name_key" ON "Subject"("name");
        `

        const allSQL = migrationSQL + indexSQL
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
