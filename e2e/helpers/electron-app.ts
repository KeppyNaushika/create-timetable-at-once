import {
  _electron,
  type ElectronApplication,
  type Page,
} from "@playwright/test"
import * as fs from "fs"
import * as os from "os"
import * as path from "path"

export const TEST_PORT = "3100"
export const TEST_BASE_URL = `http://localhost:${TEST_PORT}`

export interface AppContext {
  electronApp: ElectronApplication
  page: Page
  tmpDir: string
}

export async function launchApp(): Promise<AppContext> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "timetable-test-"))

  const electronApp = await _electron.launch({
    args: [path.resolve("main/electron-src/index.js")],
    env: {
      ...process.env,
      TIMETABLE_DATA_DIR: tmpDir,
      NODE_ENV: "test",
      NEXT_SERVER_PORT: TEST_PORT,
    },
  })

  const page = await electronApp.firstWindow()
  // firstWindow() returns when the BrowserWindow is created, but the URL
  // may not be loaded yet (Electron checks server readiness first).
  // Wait for the actual Next.js URL to be loaded.
  await page.waitForURL(/localhost/, { timeout: 30_000 })
  await page.waitForLoadState("domcontentloaded")

  return { electronApp, page, tmpDir }
}

export async function closeApp(ctx: AppContext): Promise<void> {
  try {
    await ctx.electronApp.close()
  } catch {
    // ignore close errors
  }

  try {
    fs.rmSync(ctx.tmpDir, { recursive: true, force: true })
  } catch {
    // ignore cleanup errors
  }
}
