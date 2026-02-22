import { ipcMain } from "electron"

import * as classDAL from "../lib/prisma/class"

export function registerClassHandlers() {
  ipcMain.handle("class:getAll", async () => {
    return await classDAL.getClasses()
  })

  ipcMain.handle("class:getByGradeId", async (_event, gradeId: string) => {
    return await classDAL.getClassesByGradeId(gradeId)
  })

  ipcMain.handle("class:create", async (_event, data) => {
    return await classDAL.createClass(data)
  })

  ipcMain.handle("class:update", async (_event, id: string, data) => {
    return await classDAL.updateClass(id, data)
  })

  ipcMain.handle("class:delete", async (_event, id: string) => {
    return await classDAL.deleteClass(id)
  })

  ipcMain.handle("class:batchCreate", async (_event, classes) => {
    return await classDAL.batchCreateClasses(classes)
  })
}
