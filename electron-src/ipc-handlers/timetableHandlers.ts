import { ipcMain } from "electron"

import * as slotDAL from "../lib/prisma/timetableSlot"

export function registerTimetableHandlers() {
  ipcMain.handle("timetable:place", async (_event, data) => {
    return await slotDAL.placeSlot(data)
  })

  ipcMain.handle(
    "timetable:remove",
    async (_event, patternId: string, slotId: string) => {
      return await slotDAL.removeSlot(patternId, slotId)
    }
  )

  ipcMain.handle(
    "timetable:fix",
    async (_event, slotId: string, isFixed: boolean) => {
      return await slotDAL.fixSlot(slotId, isFixed)
    }
  )

  ipcMain.handle(
    "timetable:batchPlace",
    async (_event, patternId: string, slots) => {
      return await slotDAL.batchPlaceSlots(patternId, slots)
    }
  )

  ipcMain.handle(
    "timetable:clear",
    async (_event, patternId: string, keepFixed: boolean) => {
      return await slotDAL.clearSlots(patternId, keepFixed)
    }
  )
}
