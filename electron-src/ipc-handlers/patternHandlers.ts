import { ipcMain } from "electron"

import * as patternDAL from "../lib/prisma/timetablePattern"

export function registerPatternHandlers() {
  ipcMain.handle("pattern:getAll", async () => {
    return await patternDAL.getPatterns()
  })

  ipcMain.handle("pattern:create", async (_event, data) => {
    return await patternDAL.createPattern(data)
  })

  ipcMain.handle("pattern:delete", async (_event, id: string) => {
    return await patternDAL.deletePattern(id)
  })

  ipcMain.handle("pattern:adopt", async (_event, id: string) => {
    return await patternDAL.adoptPattern(id)
  })

  ipcMain.handle("pattern:getWithSlots", async (_event, id: string) => {
    return await patternDAL.getPatternWithSlots(id)
  })

  ipcMain.handle("pattern:updateScore", async (_event, id: string, data) => {
    return await patternDAL.updatePatternScore(id, data)
  })
}
