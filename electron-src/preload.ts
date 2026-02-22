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

  // Misc
  getAppVersion: () => ipcRenderer.invoke("misc:getAppVersion"),
  getDataDirectoryInfo: () => ipcRenderer.invoke("misc:getDataDirectoryInfo"),
  openDataDirectory: () => ipcRenderer.invoke("misc:openDataDirectory"),
})

process.once("loaded", () => {
  global.ipcRenderer = ipcRenderer
})
