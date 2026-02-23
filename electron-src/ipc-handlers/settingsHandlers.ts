import { ipcMain } from "electron"

import * as appSettingDAL from "../lib/prisma/appSetting"

export function registerSettingsHandlers() {
  ipcMain.handle("setting:get", async (_event, key: string) => {
    return await appSettingDAL.getSetting(key)
  })

  ipcMain.handle("setting:set", async (_event, key: string, value: string) => {
    return await appSettingDAL.setSetting(key, value)
  })

  ipcMain.handle("setting:getAll", async () => {
    return await appSettingDAL.getAllSettings()
  })
}
