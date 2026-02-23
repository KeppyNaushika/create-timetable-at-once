import { ipcMain } from "electron"

import * as schoolEventDAL from "../lib/prisma/schoolEvent"

export function registerSchoolEventHandlers() {
  ipcMain.handle("schoolEvent:getAll", async () => {
    return await schoolEventDAL.getSchoolEvents()
  })

  ipcMain.handle(
    "schoolEvent:getByDateRange",
    async (_event, startDate: string, endDate: string) => {
      return await schoolEventDAL.getSchoolEventsByDateRange(startDate, endDate)
    }
  )

  ipcMain.handle("schoolEvent:create", async (_event, data) => {
    return await schoolEventDAL.createSchoolEvent(data)
  })

  ipcMain.handle("schoolEvent:update", async (_event, id: string, data) => {
    return await schoolEventDAL.updateSchoolEvent(id, data)
  })

  ipcMain.handle("schoolEvent:delete", async (_event, id: string) => {
    return await schoolEventDAL.deleteSchoolEvent(id)
  })

  ipcMain.handle(
    "schoolEvent:importHolidays",
    async (_event, holidays: { date: string; name: string }[]) => {
      return await schoolEventDAL.importHolidays(holidays)
    }
  )
}
