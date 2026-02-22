import { ipcMain } from "electron"

import * as roomDAL from "../lib/prisma/room"
import * as roomAvailabilityDAL from "../lib/prisma/roomAvailability"

export function registerRoomHandlers() {
  ipcMain.handle("room:getAll", async () => {
    return await roomDAL.getRooms()
  })

  ipcMain.handle("room:getById", async (_event, id: string) => {
    return await roomDAL.getRoomById(id)
  })

  ipcMain.handle("room:create", async (_event, data) => {
    return await roomDAL.createRoom(data)
  })

  ipcMain.handle("room:update", async (_event, id: string, data) => {
    return await roomDAL.updateRoom(id, data)
  })

  ipcMain.handle("room:delete", async (_event, id: string) => {
    return await roomDAL.deleteRoom(id)
  })

  ipcMain.handle("room:getWithAvailabilities", async (_event, id: string) => {
    return await roomDAL.getRoomWithAvailabilities(id)
  })

  // RoomAvailability
  ipcMain.handle("roomAvailability:upsert", async (_event, data) => {
    return await roomAvailabilityDAL.upsertRoomAvailability(data)
  })

  ipcMain.handle("roomAvailability:batchUpsert", async (_event, items) => {
    return await roomAvailabilityDAL.batchUpsertRoomAvailabilities(items)
  })

  ipcMain.handle(
    "roomAvailability:getByRoomId",
    async (_event, roomId: string) => {
      return await roomAvailabilityDAL.getRoomAvailabilities(roomId)
    }
  )
}
