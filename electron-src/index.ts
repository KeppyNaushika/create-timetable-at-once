import { app, protocol } from "electron"

import { initializeApp } from "./appInitializer"
import { setupAllIPCHandlers } from "./ipc-handlers"
import { startEmbeddedNextServer } from "./nextServerEmbedded"
import { createMainWindow, setupWindowEvents } from "./windowManager"

protocol.registerSchemesAsPrivileged([
  {
    scheme: "appimg",
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
])

app.on("ready", async () => {
  try {
    await initializeApp()

    try {
      await startEmbeddedNextServer()
    } catch (error) {
      console.error("Failed to start Next.js server:", error)
      throw error
    }

    const mainWindow = createMainWindow()
    setupWindowEvents(mainWindow)
    setupAllIPCHandlers()

    console.log("Application startup completed successfully")
  } catch (error) {
    console.error("Critical error during application startup:", error)
    app.quit()
  }
})

app.on("window-all-closed", app.quit)

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error)
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason)
})

app.on("before-quit", async () => {
  try {
    const { getPrismaClient } = await import("./lib/prisma/client")
    const prisma = getPrismaClient()
    await prisma.$disconnect()
  } catch {
    // ignore
  }
})
