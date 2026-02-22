export interface ElectronAPI {
  // School
  schoolGet: () => Promise<import("./common.types").School | null>
  schoolGetWithGrades: () => Promise<
    import("./common.types").SchoolWithGrades | null
  >
  schoolCreate: (
    data: Record<string, unknown>
  ) => Promise<import("./common.types").School>
  schoolUpdate: (
    id: string,
    data: Record<string, unknown>
  ) => Promise<import("./common.types").School>

  // Grade
  gradeGetAll: () => Promise<import("./common.types").Grade[]>
  gradeGetById: (id: string) => Promise<import("./common.types").Grade | null>
  gradeCreate: (data: {
    gradeNum: number
    name: string
  }) => Promise<import("./common.types").Grade>
  gradeUpdate: (
    id: string,
    data: Record<string, unknown>
  ) => Promise<import("./common.types").Grade>
  gradeDelete: (id: string) => Promise<import("./common.types").Grade>

  // Class
  classGetAll: () => Promise<import("./common.types").ClassInfo[]>
  classGetByGradeId: (
    gradeId: string
  ) => Promise<import("./common.types").ClassInfo[]>
  classCreate: (data: {
    gradeId: string
    name: string
    sortOrder?: number
  }) => Promise<import("./common.types").ClassInfo>
  classUpdate: (
    id: string,
    data: Record<string, unknown>
  ) => Promise<import("./common.types").ClassInfo>
  classDelete: (id: string) => Promise<import("./common.types").ClassInfo>
  classBatchCreate: (
    classes: { gradeId: string; name: string; sortOrder: number }[]
  ) => Promise<import("./common.types").ClassInfo[]>

  // Teacher
  teacherGetAll: () => Promise<import("./common.types").Teacher[]>
  teacherGetById: (
    id: string
  ) => Promise<import("./common.types").Teacher | null>
  teacherCreate: (
    data: Record<string, unknown>
  ) => Promise<import("./common.types").Teacher>
  teacherUpdate: (
    id: string,
    data: Record<string, unknown>
  ) => Promise<import("./common.types").Teacher>
  teacherDelete: (id: string) => Promise<import("./common.types").Teacher>
  teacherGetWithAvailabilities: (
    id: string
  ) => Promise<import("./common.types").Teacher | null>
  teacherBatchImport: (
    teachers: Record<string, unknown>[]
  ) => Promise<import("./common.types").Teacher[]>

  // TeacherAvailability
  teacherAvailabilityUpsert: (data: {
    teacherId: string
    dayOfWeek: number
    period: number
    status: string
  }) => Promise<import("./common.types").TeacherAvailability>
  teacherAvailabilityBatchUpsert: (
    items: {
      teacherId: string
      dayOfWeek: number
      period: number
      status: string
    }[]
  ) => Promise<import("./common.types").TeacherAvailability[]>
  teacherAvailabilityGetByTeacherId: (
    teacherId: string
  ) => Promise<import("./common.types").TeacherAvailability[]>

  // Subject
  subjectGetAll: () => Promise<import("./common.types").Subject[]>
  subjectGetById: (
    id: string
  ) => Promise<import("./common.types").Subject | null>
  subjectCreate: (
    data: Record<string, unknown>
  ) => Promise<import("./common.types").Subject>
  subjectUpdate: (
    id: string,
    data: Record<string, unknown>
  ) => Promise<import("./common.types").Subject>
  subjectDelete: (id: string) => Promise<import("./common.types").Subject>
  subjectGetByCategory: (
    category: string
  ) => Promise<import("./common.types").Subject[]>
  subjectSeedDefaults: () => Promise<void>

  // Misc
  getAppVersion: () => Promise<string>
  getDataDirectoryInfo: () => Promise<{ path: string }>
  openDataDirectory: () => Promise<void>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
