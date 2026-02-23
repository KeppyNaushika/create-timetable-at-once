import { ipcMain } from "electron"

import * as dailyScheduleDAL from "../lib/prisma/dailySchedule"
import * as dailyChangeDAL from "../lib/prisma/dailyChange"

export function registerDailyScheduleHandlers() {
  ipcMain.handle(
    "dailySchedule:getByMonth",
    async (_event, yearMonth: string) => {
      return await dailyScheduleDAL.getDailySchedulesByMonth(yearMonth)
    }
  )

  ipcMain.handle(
    "dailySchedule:getByDate",
    async (_event, date: string) => {
      return await dailyScheduleDAL.getDailyScheduleByDate(date)
    }
  )

  ipcMain.handle("dailySchedule:upsert", async (_event, data) => {
    return await dailyScheduleDAL.upsertDailySchedule(data)
  })

  ipcMain.handle("dailySchedule:delete", async (_event, id: string) => {
    return await dailyScheduleDAL.deleteDailySchedule(id)
  })

  ipcMain.handle(
    "dailyChange:getByScheduleId",
    async (_event, scheduleId: string) => {
      return await dailyChangeDAL.getDailyChangesByScheduleId(scheduleId)
    }
  )

  ipcMain.handle("dailyChange:create", async (_event, data) => {
    return await dailyChangeDAL.createDailyChange(data)
  })

  ipcMain.handle(
    "dailyChange:update",
    async (_event, id: string, data) => {
      return await dailyChangeDAL.updateDailyChange(id, data)
    }
  )

  ipcMain.handle("dailyChange:delete", async (_event, id: string) => {
    return await dailyChangeDAL.deleteDailyChange(id)
  })
}
