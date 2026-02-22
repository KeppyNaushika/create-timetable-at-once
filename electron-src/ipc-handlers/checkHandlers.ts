import { ipcMain } from "electron"

import * as checkDAL from "../lib/prisma/check"

export function registerCheckHandlers() {
  ipcMain.handle("check:teacherCapacity", async () => {
    return await checkDAL.getTeacherCapacity()
  })

  ipcMain.handle(
    "check:periodSummary",
    async (_event, daysPerWeek: number, maxPeriods: number) => {
      return await checkDAL.getPeriodSummary(daysPerWeek, maxPeriods)
    }
  )
}
