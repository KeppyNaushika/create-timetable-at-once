import type { IncomingMessage } from "electron"
import { app, BrowserWindow, Menu } from "electron"
import { join } from "path"

import menu from "./menu"

const isDev = !app.isPackaged

export function createMainWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      backgroundThrottling: false,
    },
  })

  const port = process.env.NEXT_SERVER_PORT || "3939"
  const url = `http://localhost:${port}`

  Menu.setApplicationMenu(menu(app, mainWindow))

  if (isDev && process.env.ENABLE_DEVTOOLS === "true") {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    console.error("Render process gone:", details)
  })

  const loadWhenReady = async () => {
    const maxAttempts = 30
    let attempts = 0

    const checkServer = async (): Promise<boolean> => {
      try {
        const { net } = require("electron")
        const request = net.request(url)

        return new Promise((resolve) => {
          request.on("response", (response: IncomingMessage) => {
            resolve(response.statusCode === 200)
          })
          request.on("error", () => {
            resolve(false)
          })
          request.end()
        })
      } catch {
        return false
      }
    }

    const waitForServer = async (): Promise<void> => {
      while (attempts < maxAttempts) {
        if (await checkServer()) {
          try {
            await mainWindow.loadURL(url)
            setTimeout(() => {
              mainWindow.show()
            }, 1000)
          } catch (error) {
            console.error("Error during loadURL:", error)
            throw error
          }
          return
        }

        attempts++
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      console.error("Next.js server failed to start within 30 seconds")
      mainWindow.show()
    }

    waitForServer()
  }

  loadWhenReady()

  return mainWindow
}

export function setupWindowEvents(_mainWindow: BrowserWindow): void {
  app.on("browser-window-focus", () => {
    // app became active
  })

  app.on("browser-window-blur", () => {
    // app went to background
  })
}
