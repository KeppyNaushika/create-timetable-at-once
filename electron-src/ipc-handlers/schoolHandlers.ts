import { ipcMain } from "electron"

import * as schoolDAL from "../lib/prisma/school"

export function registerSchoolHandlers() {
  ipcMain.handle("school:get", async () => {
    return await schoolDAL.getSchool()
  })

  ipcMain.handle("school:getWithGrades", async () => {
    return await schoolDAL.getSchoolWithGrades()
  })

  ipcMain.handle("school:create", async (_event, data) => {
    return await schoolDAL.createSchool(data)
  })

  ipcMain.handle("school:update", async (_event, id: string, data) => {
    return await schoolDAL.updateSchool(id, data)
  })
}
