import { ipcMain } from "electron"

import * as subjectDAL from "../lib/prisma/subject"

export function registerSubjectHandlers() {
  ipcMain.handle("subject:getAll", async () => {
    return await subjectDAL.getSubjects()
  })

  ipcMain.handle("subject:getById", async (_event, id: string) => {
    return await subjectDAL.getSubjectById(id)
  })

  ipcMain.handle("subject:create", async (_event, data) => {
    return await subjectDAL.createSubject(data)
  })

  ipcMain.handle("subject:update", async (_event, id: string, data) => {
    return await subjectDAL.updateSubject(id, data)
  })

  ipcMain.handle("subject:delete", async (_event, id: string) => {
    return await subjectDAL.deleteSubject(id)
  })

  ipcMain.handle("subject:getByCategory", async (_event, category: string) => {
    return await subjectDAL.getSubjectsByCategory(category)
  })

  ipcMain.handle("subject:seedDefaults", async () => {
    return await subjectDAL.seedDefaultSubjects()
  })
}
