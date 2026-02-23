import { contextBridge, IpcRenderer, ipcRenderer } from "electron"

declare global {
  namespace NodeJS {
    interface Global {
      ipcRenderer: IpcRenderer
    }
  }
  var ipcRenderer: IpcRenderer
}

contextBridge.exposeInMainWorld("electronAPI", {
  // School
  schoolGet: () => ipcRenderer.invoke("school:get"),
  schoolGetWithGrades: () => ipcRenderer.invoke("school:getWithGrades"),
  schoolCreate: (data: Record<string, unknown>) =>
    ipcRenderer.invoke("school:create", data),
  schoolUpdate: (id: string, data: Record<string, unknown>) =>
    ipcRenderer.invoke("school:update", id, data),

  // Grade
  gradeGetAll: () => ipcRenderer.invoke("grade:getAll"),
  gradeGetById: (id: string) => ipcRenderer.invoke("grade:getById", id),
  gradeCreate: (data: { gradeNum: number; name: string }) =>
    ipcRenderer.invoke("grade:create", data),
  gradeUpdate: (id: string, data: Record<string, unknown>) =>
    ipcRenderer.invoke("grade:update", id, data),
  gradeDelete: (id: string) => ipcRenderer.invoke("grade:delete", id),

  // Class
  classGetAll: () => ipcRenderer.invoke("class:getAll"),
  classGetByGradeId: (gradeId: string) =>
    ipcRenderer.invoke("class:getByGradeId", gradeId),
  classCreate: (data: { gradeId: string; name: string; sortOrder?: number }) =>
    ipcRenderer.invoke("class:create", data),
  classUpdate: (id: string, data: Record<string, unknown>) =>
    ipcRenderer.invoke("class:update", id, data),
  classDelete: (id: string) => ipcRenderer.invoke("class:delete", id),
  classBatchCreate: (
    classes: { gradeId: string; name: string; sortOrder: number }[]
  ) => ipcRenderer.invoke("class:batchCreate", classes),

  // Teacher
  teacherGetAll: () => ipcRenderer.invoke("teacher:getAll"),
  teacherGetById: (id: string) => ipcRenderer.invoke("teacher:getById", id),
  teacherCreate: (data: Record<string, unknown>) =>
    ipcRenderer.invoke("teacher:create", data),
  teacherUpdate: (id: string, data: Record<string, unknown>) =>
    ipcRenderer.invoke("teacher:update", id, data),
  teacherDelete: (id: string) => ipcRenderer.invoke("teacher:delete", id),
  teacherGetWithAvailabilities: (id: string) =>
    ipcRenderer.invoke("teacher:getWithAvailabilities", id),
  teacherBatchImport: (teachers: Record<string, unknown>[]) =>
    ipcRenderer.invoke("teacher:batchImport", teachers),

  // TeacherAvailability
  teacherAvailabilityUpsert: (data: {
    teacherId: string
    dayOfWeek: number
    period: number
    status: string
  }) => ipcRenderer.invoke("teacherAvailability:upsert", data),
  teacherAvailabilityBatchUpsert: (
    items: {
      teacherId: string
      dayOfWeek: number
      period: number
      status: string
    }[]
  ) => ipcRenderer.invoke("teacherAvailability:batchUpsert", items),
  teacherAvailabilityGetByTeacherId: (teacherId: string) =>
    ipcRenderer.invoke("teacherAvailability:getByTeacherId", teacherId),

  // Subject
  subjectGetAll: () => ipcRenderer.invoke("subject:getAll"),
  subjectGetById: (id: string) => ipcRenderer.invoke("subject:getById", id),
  subjectCreate: (data: Record<string, unknown>) =>
    ipcRenderer.invoke("subject:create", data),
  subjectUpdate: (id: string, data: Record<string, unknown>) =>
    ipcRenderer.invoke("subject:update", id, data),
  subjectDelete: (id: string) => ipcRenderer.invoke("subject:delete", id),
  subjectGetByCategory: (category: string) =>
    ipcRenderer.invoke("subject:getByCategory", category),
  subjectSeedDefaults: () => ipcRenderer.invoke("subject:seedDefaults"),

  // SpecialRoom
  roomGetAll: () => ipcRenderer.invoke("room:getAll"),
  roomGetById: (id: string) => ipcRenderer.invoke("room:getById", id),
  roomCreate: (data: Record<string, unknown>) =>
    ipcRenderer.invoke("room:create", data),
  roomUpdate: (id: string, data: Record<string, unknown>) =>
    ipcRenderer.invoke("room:update", id, data),
  roomDelete: (id: string) => ipcRenderer.invoke("room:delete", id),
  roomGetWithAvailabilities: (id: string) =>
    ipcRenderer.invoke("room:getWithAvailabilities", id),

  // RoomAvailability
  roomAvailabilityUpsert: (data: {
    roomId: string
    dayOfWeek: number
    period: number
    status: string
  }) => ipcRenderer.invoke("roomAvailability:upsert", data),
  roomAvailabilityBatchUpsert: (
    items: {
      roomId: string
      dayOfWeek: number
      period: number
      status: string
    }[]
  ) => ipcRenderer.invoke("roomAvailability:batchUpsert", items),
  roomAvailabilityGetByRoomId: (roomId: string) =>
    ipcRenderer.invoke("roomAvailability:getByRoomId", roomId),

  // Duty
  dutyGetAll: () => ipcRenderer.invoke("duty:getAll"),
  dutyGetById: (id: string) => ipcRenderer.invoke("duty:getById", id),
  dutyCreate: (data: Record<string, unknown>) =>
    ipcRenderer.invoke("duty:create", data),
  dutyUpdate: (id: string, data: Record<string, unknown>) =>
    ipcRenderer.invoke("duty:update", id, data),
  dutyDelete: (id: string) => ipcRenderer.invoke("duty:delete", id),
  dutySetTeachers: (dutyId: string, teacherIds: string[]) =>
    ipcRenderer.invoke("duty:setTeachers", dutyId, teacherIds),

  // Koma
  komaGetAll: () => ipcRenderer.invoke("koma:getAll"),
  komaGetById: (id: string) => ipcRenderer.invoke("koma:getById", id),
  komaGetByGradeId: (gradeId: string) =>
    ipcRenderer.invoke("koma:getByGradeId", gradeId),
  komaCreate: (data: Record<string, unknown>) =>
    ipcRenderer.invoke("koma:create", data),
  komaUpdate: (id: string, data: Record<string, unknown>) =>
    ipcRenderer.invoke("koma:update", id, data),
  komaDelete: (id: string) => ipcRenderer.invoke("koma:delete", id),
  komaDuplicate: (id: string) => ipcRenderer.invoke("koma:duplicate", id),
  komaSetTeachers: (
    komaId: string,
    teachers: { teacherId: string; role: string }[]
  ) => ipcRenderer.invoke("koma:setTeachers", komaId, teachers),
  komaSetClasses: (komaId: string, classIds: string[]) =>
    ipcRenderer.invoke("koma:setClasses", komaId, classIds),
  komaSetRooms: (komaId: string, roomIds: string[]) =>
    ipcRenderer.invoke("koma:setRooms", komaId, roomIds),
  komaBatchCreate: (komas: Record<string, unknown>[]) =>
    ipcRenderer.invoke("koma:batchCreate", komas),
  komaGetByTeacherId: (teacherId: string) =>
    ipcRenderer.invoke("koma:getByTeacherId", teacherId),
  komaDeleteByGradeId: (gradeId: string) =>
    ipcRenderer.invoke("koma:deleteByGradeId", gradeId),

  // Check
  checkTeacherCapacity: () => ipcRenderer.invoke("check:teacherCapacity"),
  checkPeriodSummary: (daysPerWeek: number, maxPeriods: number) =>
    ipcRenderer.invoke("check:periodSummary", daysPerWeek, maxPeriods),

  // ScheduleCondition
  conditionGet: () => ipcRenderer.invoke("condition:get"),
  conditionUpsert: (data: Record<string, unknown>) =>
    ipcRenderer.invoke("condition:upsert", data),
  conditionUpsertPerSubject: (data: {
    conditionId: string
    subjectId: string
    placementRestriction?: string
    maxPerDay?: number
  }) => ipcRenderer.invoke("condition:upsertPerSubject", data),
  conditionDeletePerSubject: (conditionId: string, subjectId: string) =>
    ipcRenderer.invoke("condition:deletePerSubject", conditionId, subjectId),

  // Timetable
  timetablePlace: (data: {
    patternId: string
    komaId: string
    dayOfWeek: number
    period: number
    placedBy?: string
  }) => ipcRenderer.invoke("timetable:place", data),
  timetableRemove: (patternId: string, slotId: string) =>
    ipcRenderer.invoke("timetable:remove", patternId, slotId),
  timetableFix: (slotId: string, isFixed: boolean) =>
    ipcRenderer.invoke("timetable:fix", slotId, isFixed),
  timetableBatchPlace: (
    patternId: string,
    slots: {
      komaId: string
      dayOfWeek: number
      period: number
      placedBy?: string
    }[]
  ) => ipcRenderer.invoke("timetable:batchPlace", patternId, slots),
  timetableClear: (patternId: string, keepFixed: boolean) =>
    ipcRenderer.invoke("timetable:clear", patternId, keepFixed),

  // TimetablePattern
  patternGetAll: () => ipcRenderer.invoke("pattern:getAll"),
  patternCreate: (data: { name?: string; status?: string }) =>
    ipcRenderer.invoke("pattern:create", data),
  patternDelete: (id: string) => ipcRenderer.invoke("pattern:delete", id),
  patternAdopt: (id: string) => ipcRenderer.invoke("pattern:adopt", id),
  patternGetWithSlots: (id: string) =>
    ipcRenderer.invoke("pattern:getWithSlots", id),
  patternUpdateScore: (
    id: string,
    data: { violationCount: number; score: number }
  ) => ipcRenderer.invoke("pattern:updateScore", id, data),

  // Export
  exportExcel: (reportType: string, data: unknown, defaultFileName: string) =>
    ipcRenderer.invoke("export:excel", reportType, data, defaultFileName),
  exportSavePdf: (pdfData: number[], defaultFileName: string) =>
    ipcRenderer.invoke("export:savePdf", pdfData, defaultFileName),

  // DailySchedule
  dailyScheduleGetByMonth: (yearMonth: string) =>
    ipcRenderer.invoke("dailySchedule:getByMonth", yearMonth),
  dailyScheduleGetByDate: (date: string) =>
    ipcRenderer.invoke("dailySchedule:getByDate", date),
  dailyScheduleUpsert: (data: Record<string, unknown>) =>
    ipcRenderer.invoke("dailySchedule:upsert", data),
  dailyScheduleDelete: (id: string) =>
    ipcRenderer.invoke("dailySchedule:delete", id),

  // DailyChange
  dailyChangeGetByScheduleId: (scheduleId: string) =>
    ipcRenderer.invoke("dailyChange:getByScheduleId", scheduleId),
  dailyChangeCreate: (data: Record<string, unknown>) =>
    ipcRenderer.invoke("dailyChange:create", data),
  dailyChangeUpdate: (id: string, data: Record<string, unknown>) =>
    ipcRenderer.invoke("dailyChange:update", id, data),
  dailyChangeDelete: (id: string) =>
    ipcRenderer.invoke("dailyChange:delete", id),

  // SchoolEvent
  schoolEventGetAll: () => ipcRenderer.invoke("schoolEvent:getAll"),
  schoolEventGetByDateRange: (startDate: string, endDate: string) =>
    ipcRenderer.invoke("schoolEvent:getByDateRange", startDate, endDate),
  schoolEventCreate: (data: Record<string, unknown>) =>
    ipcRenderer.invoke("schoolEvent:create", data),
  schoolEventUpdate: (id: string, data: Record<string, unknown>) =>
    ipcRenderer.invoke("schoolEvent:update", id, data),
  schoolEventDelete: (id: string) =>
    ipcRenderer.invoke("schoolEvent:delete", id),
  schoolEventImportHolidays: (holidays: { date: string; name: string }[]) =>
    ipcRenderer.invoke("schoolEvent:importHolidays", holidays),

  // ExamSchedule
  examScheduleGetAll: () => ipcRenderer.invoke("examSchedule:getAll"),
  examScheduleGetById: (id: string) =>
    ipcRenderer.invoke("examSchedule:getById", id),
  examScheduleCreate: (data: Record<string, unknown>) =>
    ipcRenderer.invoke("examSchedule:create", data),
  examScheduleUpdate: (id: string, data: Record<string, unknown>) =>
    ipcRenderer.invoke("examSchedule:update", id, data),
  examScheduleDelete: (id: string) =>
    ipcRenderer.invoke("examSchedule:delete", id),

  // ExamAssignment
  examAssignmentGetByScheduleId: (scheduleId: string) =>
    ipcRenderer.invoke("examAssignment:getByScheduleId", scheduleId),
  examAssignmentBatchUpsert: (
    scheduleId: string,
    assignments: Record<string, unknown>[]
  ) => ipcRenderer.invoke("examAssignment:batchUpsert", scheduleId, assignments),
  examAssignmentDelete: (id: string) =>
    ipcRenderer.invoke("examAssignment:delete", id),
  examAssignmentClear: (scheduleId: string) =>
    ipcRenderer.invoke("examAssignment:clear", scheduleId),

  // AppSetting
  settingGet: (key: string) => ipcRenderer.invoke("setting:get", key),
  settingSet: (key: string, value: string) =>
    ipcRenderer.invoke("setting:set", key, value),
  settingGetAll: () => ipcRenderer.invoke("setting:getAll"),

  // Backup
  backupCreate: () => ipcRenderer.invoke("backup:create"),
  backupRestore: (path: string) => ipcRenderer.invoke("backup:restore", path),
  backupGetList: () => ipcRenderer.invoke("backup:getList"),
  backupDelete: (path: string) => ipcRenderer.invoke("backup:delete", path),

  // Misc
  getAppVersion: () => ipcRenderer.invoke("misc:getAppVersion"),
  getDataDirectoryInfo: () => ipcRenderer.invoke("misc:getDataDirectoryInfo"),
  openDataDirectory: () => ipcRenderer.invoke("misc:openDataDirectory"),
})

process.once("loaded", () => {
  global.ipcRenderer = ipcRenderer
})
