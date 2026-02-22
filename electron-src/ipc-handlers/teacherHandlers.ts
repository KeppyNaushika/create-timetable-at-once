import { ipcMain } from "electron"

import * as teacherDAL from "../lib/prisma/teacher"
import * as availabilityDAL from "../lib/prisma/teacherAvailability"

export function registerTeacherHandlers() {
  ipcMain.handle("teacher:getAll", async () => {
    return await teacherDAL.getTeachers()
  })

  ipcMain.handle("teacher:getById", async (_event, id: string) => {
    return await teacherDAL.getTeacherById(id)
  })

  ipcMain.handle("teacher:create", async (_event, data) => {
    return await teacherDAL.createTeacher(data)
  })

  ipcMain.handle("teacher:update", async (_event, id: string, data) => {
    return await teacherDAL.updateTeacher(id, data)
  })

  ipcMain.handle("teacher:delete", async (_event, id: string) => {
    return await teacherDAL.deleteTeacher(id)
  })

  ipcMain.handle(
    "teacher:getWithAvailabilities",
    async (_event, id: string) => {
      return await teacherDAL.getTeacherWithAvailabilities(id)
    }
  )

  ipcMain.handle("teacher:batchImport", async (_event, teachers) => {
    return await teacherDAL.batchImportTeachers(teachers)
  })

  // TeacherAvailability
  ipcMain.handle("teacherAvailability:upsert", async (_event, data) => {
    return await availabilityDAL.upsertTeacherAvailability(data)
  })

  ipcMain.handle("teacherAvailability:batchUpsert", async (_event, items) => {
    return await availabilityDAL.batchUpsertTeacherAvailabilities(items)
  })

  ipcMain.handle(
    "teacherAvailability:getByTeacherId",
    async (_event, teacherId: string) => {
      return await availabilityDAL.getTeacherAvailabilities(teacherId)
    }
  )
}
