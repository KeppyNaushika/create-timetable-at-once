import { PrismaClient } from "@prisma/client"
import * as fs from "fs"
import * as path from "path"

import {
  createSharedPrismaClient,
  getDatabasePath,
} from "./prisma/databaseInitializer"

export class DatabaseSetup {
  private prisma: PrismaClient
  private dbPath: string

  constructor() {
    this.prisma = createSharedPrismaClient()
    this.dbPath = getDatabasePath()
  }

  isDatabaseExists(): boolean {
    const absolutePath = path.resolve(this.dbPath)
    try {
      return fs.existsSync(absolutePath)
    } catch {
      return false
    }
  }

  async isDatabaseEmpty(): Promise<boolean> {
    try {
      const schoolCount = await this.prisma.school.count()
      return schoolCount === 0
    } catch {
      return true
    }
  }

  ensureDatabaseDirectory(): void {
    const dbDir = path.dirname(path.resolve(this.dbPath))
    try {
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true, mode: 0o755 })
      }
    } catch (error) {
      throw new Error(
        `Database directory creation failed: ${error instanceof Error ? error.message : error}`
      )
    }
  }

  async runSeed(): Promise<void> {
    try {
      // デフォルト学校レコードの作成
      const existingSchool = await this.prisma.school.findFirst()
      if (!existingSchool) {
        await this.prisma.school.create({
          data: {
            name: "",
            academicYear: new Date().getFullYear(),
          },
        })
      }

      // デフォルト科目のシード
      const defaultSubjects = [
        {
          name: "国語",
          shortName: "国",
          color: "#EF4444",
          category: "general",
          sortOrder: 1,
        },
        {
          name: "社会",
          shortName: "社",
          color: "#F59E0B",
          category: "general",
          sortOrder: 2,
        },
        {
          name: "数学",
          shortName: "数",
          color: "#3B82F6",
          category: "general",
          sortOrder: 3,
        },
        {
          name: "理科",
          shortName: "理",
          color: "#10B981",
          category: "general",
          sortOrder: 4,
        },
        {
          name: "英語",
          shortName: "英",
          color: "#8B5CF6",
          category: "general",
          sortOrder: 5,
        },
        {
          name: "音楽",
          shortName: "音",
          color: "#EC4899",
          category: "general",
          sortOrder: 6,
        },
        {
          name: "美術",
          shortName: "美",
          color: "#F97316",
          category: "general",
          sortOrder: 7,
        },
        {
          name: "保健体育",
          shortName: "体",
          color: "#06B6D4",
          category: "general",
          sortOrder: 8,
        },
        {
          name: "技術・家庭",
          shortName: "技家",
          color: "#84CC16",
          category: "general",
          sortOrder: 9,
        },
        {
          name: "道徳",
          shortName: "道",
          color: "#A855F7",
          category: "reserve",
          sortOrder: 10,
        },
        {
          name: "学活",
          shortName: "学",
          color: "#64748B",
          category: "reserve",
          sortOrder: 11,
        },
        {
          name: "総合",
          shortName: "総",
          color: "#14B8A6",
          category: "reserve",
          sortOrder: 12,
        },
        {
          name: "職員会議",
          shortName: "職",
          color: "#9CA3AF",
          category: "school_affair",
          sortOrder: 13,
        },
        {
          name: "研修",
          shortName: "研",
          color: "#78716C",
          category: "school_affair",
          sortOrder: 14,
        },
      ]

      for (const subject of defaultSubjects) {
        await this.prisma.subject.upsert({
          where: { name: subject.name },
          update: {},
          create: {
            ...subject,
            isDefault: true,
          },
        })
      }
    } catch (error) {
      console.error("Error during seed:", error)
      throw error
    }
  }

  async setupIfNeeded(): Promise<boolean> {
    try {
      const dbExists = this.isDatabaseExists()
      let setupPerformed = false

      if (!dbExists) {
        this.ensureDatabaseDirectory()

        const { initializeDatabase } =
          await import("./prisma/databaseInitializer")
        const wasCreated = await initializeDatabase()

        if (wasCreated) {
          await this.runSeed()
          setupPerformed = true
        }
      } else {
        const isEmpty = await this.isDatabaseEmpty()
        if (isEmpty) {
          await this.runSeed()
          setupPerformed = true
        }
      }

      return setupPerformed
    } catch (error) {
      console.error("Database setup failed:", error)
      throw error
    } finally {
      await this.prisma.$disconnect()
    }
  }
}
