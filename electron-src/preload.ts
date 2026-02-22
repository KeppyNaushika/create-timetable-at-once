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

  // Misc
  getAppVersion: () => ipcRenderer.invoke("misc:getAppVersion"),
  getDataDirectoryInfo: () => ipcRenderer.invoke("misc:getDataDirectoryInfo"),
  openDataDirectory: () => ipcRenderer.invoke("misc:openDataDirectory"),
})

process.once("loaded", () => {
  global.ipcRenderer = ipcRenderer
})
