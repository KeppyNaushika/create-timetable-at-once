import { ipcMain } from "electron"

import * as gradeDAL from "../lib/prisma/grade"

export function registerGradeHandlers() {
  ipcMain.handle("grade:getAll", async () => {
    return await gradeDAL.getGrades()
  })

  ipcMain.handle("grade:getById", async (_event, id: string) => {
    return await gradeDAL.getGradeById(id)
  })

  ipcMain.handle("grade:create", async (_event, data) => {
    return await gradeDAL.createGrade(data)
  })

  ipcMain.handle("grade:update", async (_event, id: string, data) => {
    return await gradeDAL.updateGrade(id, data)
  })

  ipcMain.handle("grade:delete", async (_event, id: string) => {
    return await gradeDAL.deleteGrade(id)
  })
}
