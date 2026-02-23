import { ipcMain } from "electron"

import * as backupManager from "../lib/backupManager"

export function registerBackupHandlers() {
  ipcMain.handle("backup:create", async () => {
    return await backupManager.createBackup()
  })

  ipcMain.handle("backup:restore", async (_event, backupPath: string) => {
    return await backupManager.restoreBackup(backupPath)
  })

  ipcMain.handle("backup:getList", async () => {
    return await backupManager.getBackupList()
  })

  ipcMain.handle("backup:delete", async (_event, backupPath: string) => {
    return await backupManager.deleteBackup(backupPath)
  })
}
