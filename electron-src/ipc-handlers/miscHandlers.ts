import { app, ipcMain, shell } from "electron"

import { getDataDirectory } from "../lib/dataManager"

export function registerMiscHandlers() {
  ipcMain.handle("misc:getAppVersion", async () => {
    return app.getVersion()
  })

  ipcMain.handle("misc:getDataDirectoryInfo", async () => {
    const dataDir = getDataDirectory()
    return { path: dataDir }
  })

  ipcMain.handle("misc:openDataDirectory", async () => {
    const dataDir = getDataDirectory()
    await shell.openPath(dataDir)
  })
}
