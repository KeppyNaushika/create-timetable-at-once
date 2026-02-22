import { app } from "electron"
import * as fs from "fs/promises"
import * as path from "path"

export const getAppRootPath = (): string => {
  if (app.isPackaged) {
    const exePath = app.getPath("exe")
    if (process.platform === "darwin" && exePath.includes(".app/")) {
      const appPath = exePath.substring(0, exePath.indexOf(".app/") + 4)
      return path.dirname(appPath)
    }
    return path.dirname(exePath)
  } else {
    return process.cwd()
  }
}

export const getDataDirectory = (): string => {
  if (process.env.TIMETABLE_DATA_DIR) {
    return process.env.TIMETABLE_DATA_DIR
  }
  return path.join(getAppRootPath(), "data")
}

export const initializeDataDirectory = async (): Promise<void> => {
  const dataDir = getDataDirectory()

  try {
    const parentDir = path.dirname(dataDir)
    await fs.mkdir(parentDir, { recursive: true, mode: 0o755 })
    await fs.mkdir(dataDir, { recursive: true, mode: 0o755 })
  } catch (error) {
    console.error("Failed to initialize data directory:", error)
    throw new Error(
      `Data directory initialization failed: ${error instanceof Error ? error.message : error}`
    )
  }
}

export const getAbsolutePathFromData = (relativePath: string): string => {
  return path.join(getDataDirectory(), relativePath)
}
