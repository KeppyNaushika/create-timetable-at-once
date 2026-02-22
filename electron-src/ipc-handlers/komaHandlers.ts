import { ipcMain } from "electron"

import * as komaDAL from "../lib/prisma/koma"

export function registerKomaHandlers() {
  ipcMain.handle("koma:getAll", async () => {
    return await komaDAL.getKomas()
  })

  ipcMain.handle("koma:getById", async (_event, id: string) => {
    return await komaDAL.getKomaById(id)
  })

  ipcMain.handle("koma:getByGradeId", async (_event, gradeId: string) => {
    return await komaDAL.getKomasByGradeId(gradeId)
  })

  ipcMain.handle("koma:create", async (_event, data) => {
    return await komaDAL.createKoma(data)
  })

  ipcMain.handle("koma:update", async (_event, id: string, data) => {
    return await komaDAL.updateKoma(id, data)
  })

  ipcMain.handle("koma:delete", async (_event, id: string) => {
    return await komaDAL.deleteKoma(id)
  })

  ipcMain.handle("koma:duplicate", async (_event, id: string) => {
    return await komaDAL.duplicateKoma(id)
  })

  ipcMain.handle(
    "koma:setTeachers",
    async (
      _event,
      komaId: string,
      teachers: { teacherId: string; role: string }[]
    ) => {
      return await komaDAL.setKomaTeachers(komaId, teachers)
    }
  )

  ipcMain.handle(
    "koma:setClasses",
    async (_event, komaId: string, classIds: string[]) => {
      return await komaDAL.setKomaClasses(komaId, classIds)
    }
  )

  ipcMain.handle(
    "koma:setRooms",
    async (_event, komaId: string, roomIds: string[]) => {
      return await komaDAL.setKomaRooms(komaId, roomIds)
    }
  )

  ipcMain.handle("koma:batchCreate", async (_event, komas) => {
    return await komaDAL.batchCreateKomas(komas)
  })

  ipcMain.handle(
    "koma:getByTeacherId",
    async (_event, teacherId: string) => {
      return await komaDAL.getKomasByTeacherId(teacherId)
    }
  )

  ipcMain.handle(
    "koma:deleteByGradeId",
    async (_event, gradeId: string) => {
      return await komaDAL.deleteKomasByGradeId(gradeId)
    }
  )
}
