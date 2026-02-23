import * as fs from "fs/promises"
import * as path from "path"

import { getDatabasePath } from "./prisma/databaseInitializer"
import { getDataDirectory } from "./dataManager"

function getBackupDirectory(): string {
  return path.join(getDataDirectory(), "backups")
}

export async function createBackup(): Promise<{ success: boolean; path?: string }> {
  try {
    const backupDir = getBackupDirectory()
    await fs.mkdir(backupDir, { recursive: true })

    const now = new Date()
    // Format: backup_YYYY-MM-DD_HHmmss.db
    const fileName = `backup_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}.db`
    const backupPath = path.join(backupDir, fileName)

    const dbPath = getDatabasePath()
    await fs.copyFile(dbPath, backupPath)

    return { success: true, path: backupPath }
  } catch (error) {
    console.error("バックアップ作成エラー:", error)
    return { success: false }
  }
}

export async function restoreBackup(
  backupPath: string
): Promise<{ success: boolean }> {
  try {
    const dbPath = getDatabasePath()

    // Verify backup file exists
    await fs.access(backupPath)

    await fs.copyFile(backupPath, dbPath)

    return { success: true }
  } catch (error) {
    console.error("バックアップ復元エラー:", error)
    return { success: false }
  }
}

export async function getBackupList(): Promise<
  { name: string; path: string; size: number; date: Date }[]
> {
  try {
    const backupDir = getBackupDirectory()
    await fs.mkdir(backupDir, { recursive: true })

    const files = await fs.readdir(backupDir)
    const backups: { name: string; path: string; size: number; date: Date }[] =
      []

    for (const file of files) {
      if (!file.endsWith(".db")) continue
      const filePath = path.join(backupDir, file)
      const stat = await fs.stat(filePath)
      backups.push({
        name: file,
        path: filePath,
        size: stat.size,
        date: stat.mtime,
      })
    }

    // Sort by date descending (newest first)
    backups.sort((a, b) => b.date.getTime() - a.date.getTime())

    return backups
  } catch (error) {
    console.error("バックアップ一覧取得エラー:", error)
    return []
  }
}

export async function deleteBackup(
  backupPath: string
): Promise<{ success: boolean }> {
  try {
    await fs.unlink(backupPath)
    return { success: true }
  } catch (error) {
    console.error("バックアップ削除エラー:", error)
    return { success: false }
  }
}
