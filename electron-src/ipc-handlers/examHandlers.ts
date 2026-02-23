import { ipcMain } from "electron"

import * as examScheduleDAL from "../lib/prisma/examSchedule"
import * as examAssignmentDAL from "../lib/prisma/examAssignment"

export function registerExamHandlers() {
  // ExamSchedule handlers
  ipcMain.handle("examSchedule:getAll", async () => {
    return await examScheduleDAL.getExamSchedules()
  })

  ipcMain.handle("examSchedule:getById", async (_event, id: string) => {
    return await examScheduleDAL.getExamScheduleById(id)
  })

  ipcMain.handle("examSchedule:create", async (_event, data) => {
    return await examScheduleDAL.createExamSchedule(data)
  })

  ipcMain.handle("examSchedule:update", async (_event, id: string, data) => {
    return await examScheduleDAL.updateExamSchedule(id, data)
  })

  ipcMain.handle("examSchedule:delete", async (_event, id: string) => {
    return await examScheduleDAL.deleteExamSchedule(id)
  })

  // ExamAssignment handlers
  ipcMain.handle(
    "examAssignment:getByScheduleId",
    async (_event, scheduleId: string) => {
      return await examAssignmentDAL.getExamAssignmentsByScheduleId(scheduleId)
    }
  )

  ipcMain.handle(
    "examAssignment:batchUpsert",
    async (
      _event,
      scheduleId: string,
      assignments: {
        date: string
        period: number
        subjectId: string
        classId: string
        supervisorId: string
        assignedBy?: string
      }[]
    ) => {
      return await examAssignmentDAL.batchUpsertExamAssignments(
        scheduleId,
        assignments
      )
    }
  )

  ipcMain.handle("examAssignment:delete", async (_event, id: string) => {
    return await examAssignmentDAL.deleteExamAssignment(id)
  })

  ipcMain.handle(
    "examAssignment:clear",
    async (_event, scheduleId: string) => {
      return await examAssignmentDAL.clearExamAssignments(scheduleId)
    }
  )
}
