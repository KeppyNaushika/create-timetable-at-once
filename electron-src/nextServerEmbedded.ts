import { app } from "electron"
import type { Server } from "http"
import type { IncomingMessage, ServerResponse } from "http"
import type { NextServer } from "next/dist/server/next"
import { delimiter, join } from "path"

const isDev = !app.isPackaged

let nextApp: NextServer | null = null
let httpServer: Server | null = null

const ensurePackagedNodePath = (basePath: string) => {
  try {
    const fs = require("fs")
    const Module = require("module") as typeof import("module") & {
      _initPaths(): void
    }

    const candidatePaths = [
      join(basePath, "app.asar", "node_modules"),
      join(basePath, "app.asar.unpacked", "node_modules"),
      join(basePath, "node_modules"),
    ].filter((p: string) => fs.existsSync(p))

    if (!candidatePaths.length) return

    const existing = process.env.NODE_PATH
      ? process.env.NODE_PATH.split(delimiter).filter(Boolean)
      : []
    const updated = Array.from(new Set([...candidatePaths, ...existing]))

    process.env.NODE_PATH = updated.join(delimiter)
    Module._initPaths()
  } catch (error) {
    console.warn("Failed to extend NODE_PATH:", error)
  }
}

export async function startEmbeddedNextServer(): Promise<void> {
  if (isDev) return

  try {
    const { createServer } = require("http")
    const hostname = "localhost"
    const port = 3000

    let appDir
    if (process.resourcesPath) {
      appDir = process.resourcesPath
      ensurePackagedNodePath(appDir)
    } else {
      appDir = process.cwd()
    }

    const next = require("next")
    nextApp = next({
      dev: false,
      hostname,
      port,
      dir: appDir,
    }) as NextServer

    const handle = nextApp.getRequestHandler()
    await nextApp.prepare()

    httpServer = createServer(
      async (req: IncomingMessage, res: ServerResponse) => {
        try {
          await handle(req, res)
        } catch (err) {
          console.error("Error occurred handling", req.url, err)
          res.statusCode = 500
          res.end("internal server error")
        }
      }
    )

    return new Promise<void>((resolve, reject) => {
      httpServer!.listen(port, hostname, () => {
        console.log("Next.js server is now ready")
        resolve()
      })
      httpServer!.on("error", (err: Error) => {
        console.error("Failed to start Next.js server:", err)
        reject(err)
      })
    })
  } catch (error) {
    console.error("Error starting embedded Next.js server:", error)
    throw error
  }
}

export function stopEmbeddedNextServer(): void {
  if (httpServer) {
    httpServer.close()
    httpServer = null
  }
  if (nextApp) {
    nextApp = null
  }
}
