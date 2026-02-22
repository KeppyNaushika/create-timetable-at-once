import { ipcMain } from "electron"

import * as dutyDAL from "../lib/prisma/duty"
import * as teacherDutyDAL from "../lib/prisma/teacherDuty"

export function registerDutyHandlers() {
  ipcMain.handle("duty:getAll", async () => {
    return await dutyDAL.getDuties()
  })

  ipcMain.handle("duty:getById", async (_event, id: string) => {
    return await dutyDAL.getDutyById(id)
  })

  ipcMain.handle("duty:create", async (_event, data) => {
    return await dutyDAL.createDuty(data)
  })

  ipcMain.handle("duty:update", async (_event, id: string, data) => {
    return await dutyDAL.updateDuty(id, data)
  })

  ipcMain.handle("duty:delete", async (_event, id: string) => {
    return await dutyDAL.deleteDuty(id)
  })

  ipcMain.handle(
    "duty:setTeachers",
    async (_event, dutyId: string, teacherIds: string[]) => {
      return await teacherDutyDAL.batchSetTeachersForDuty(dutyId, teacherIds)
    }
  )
}
