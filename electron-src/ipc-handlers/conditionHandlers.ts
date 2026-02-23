import { ipcMain } from "electron"

import * as conditionDAL from "../lib/prisma/condition"

export function registerConditionHandlers() {
  ipcMain.handle("condition:get", async () => {
    return await conditionDAL.getCondition()
  })

  ipcMain.handle("condition:upsert", async (_event, data) => {
    return await conditionDAL.upsertCondition(data)
  })

  ipcMain.handle(
    "condition:upsertPerSubject",
    async (
      _event,
      data: {
        conditionId: string
        subjectId: string
        level?: string
        placementRestriction?: string
        maxPerDay?: number
      }
    ) => {
      return await conditionDAL.upsertPerSubjectCondition(data)
    }
  )

  ipcMain.handle(
    "condition:deletePerSubject",
    async (_event, conditionId: string, subjectId: string) => {
      return await conditionDAL.deletePerSubjectCondition(
        conditionId,
        subjectId
      )
    }
  )
}
