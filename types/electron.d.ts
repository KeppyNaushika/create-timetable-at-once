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

  // SpecialRoom
  roomGetAll: () => Promise<import("./common.types").SpecialRoom[]>
  roomGetById: (
    id: string
  ) => Promise<import("./common.types").SpecialRoom | null>
  roomCreate: (
    data: Record<string, unknown>
  ) => Promise<import("./common.types").SpecialRoom>
  roomUpdate: (
    id: string,
    data: Record<string, unknown>
  ) => Promise<import("./common.types").SpecialRoom>
  roomDelete: (id: string) => Promise<import("./common.types").SpecialRoom>
  roomGetWithAvailabilities: (
    id: string
  ) => Promise<import("./common.types").SpecialRoom | null>

  // RoomAvailability
  roomAvailabilityUpsert: (data: {
    roomId: string
    dayOfWeek: number
    period: number
    status: string
  }) => Promise<import("./common.types").RoomAvailability>
  roomAvailabilityBatchUpsert: (
    items: {
      roomId: string
      dayOfWeek: number
      period: number
      status: string
    }[]
  ) => Promise<import("./common.types").RoomAvailability[]>
  roomAvailabilityGetByRoomId: (
    roomId: string
  ) => Promise<import("./common.types").RoomAvailability[]>

  // Duty
  dutyGetAll: () => Promise<import("./common.types").Duty[]>
  dutyGetById: (id: string) => Promise<import("./common.types").Duty | null>
  dutyCreate: (
    data: Record<string, unknown>
  ) => Promise<import("./common.types").Duty>
  dutyUpdate: (
    id: string,
    data: Record<string, unknown>
  ) => Promise<import("./common.types").Duty>
  dutyDelete: (id: string) => Promise<import("./common.types").Duty>
  dutySetTeachers: (dutyId: string, teacherIds: string[]) => Promise<void>

  // Koma
  komaGetAll: () => Promise<import("./common.types").Koma[]>
  komaGetById: (id: string) => Promise<import("./common.types").Koma | null>
  komaGetByGradeId: (
    gradeId: string
  ) => Promise<import("./common.types").Koma[]>
  komaCreate: (
    data: Record<string, unknown>
  ) => Promise<import("./common.types").Koma>
  komaUpdate: (
    id: string,
    data: Record<string, unknown>
  ) => Promise<import("./common.types").Koma>
  komaDelete: (id: string) => Promise<import("./common.types").Koma>
  komaDuplicate: (id: string) => Promise<import("./common.types").Koma>
  komaSetTeachers: (
    komaId: string,
    teachers: { teacherId: string; role: string }[]
  ) => Promise<void>
  komaSetClasses: (komaId: string, classIds: string[]) => Promise<void>
  komaSetRooms: (komaId: string, roomIds: string[]) => Promise<void>
  komaBatchCreate: (
    komas: Record<string, unknown>[]
  ) => Promise<import("./common.types").Koma[]>
  komaGetByTeacherId: (
    teacherId: string
  ) => Promise<import("./common.types").Koma[]>
  komaDeleteByGradeId: (gradeId: string) => Promise<void>

  // Check
  checkTeacherCapacity: () => Promise<
    {
      id: string
      name: string
      maxPerDay: number
      maxPeriodsPerWeek: number
      maxConsecutive: number
      totalKomaCount: number
      unavailableCount: number
      dutyCount: number
      komaCount: number
    }[]
  >
  checkPeriodSummary: (
    daysPerWeek: number,
    maxPeriods: number
  ) => Promise<
    {
      dayOfWeek: number
      period: number
      availableTeachers: number
      requiredSlots: number
    }[]
  >

  // ScheduleCondition
  conditionGet: () => Promise<import("./common.types").ScheduleCondition | null>
  conditionUpsert: (
    data: Record<string, unknown>
  ) => Promise<import("./common.types").ScheduleCondition>
  conditionUpsertPerSubject: (data: {
    conditionId: string
    subjectId: string
    placementRestriction?: string
    maxPerDay?: number
  }) => Promise<import("./common.types").PerSubjectCondition>
  conditionDeletePerSubject: (
    conditionId: string,
    subjectId: string
  ) => Promise<void>

  // Timetable
  timetablePlace: (data: {
    patternId: string
    komaId: string
    dayOfWeek: number
    period: number
    placedBy?: string
  }) => Promise<import("./common.types").TimetableSlot>
  timetableRemove: (patternId: string, slotId: string) => Promise<void>
  timetableFix: (
    slotId: string,
    isFixed: boolean
  ) => Promise<import("./common.types").TimetableSlot>
  timetableBatchPlace: (
    patternId: string,
    slots: {
      komaId: string
      dayOfWeek: number
      period: number
      placedBy?: string
    }[]
  ) => Promise<import("./common.types").TimetableSlot[]>
  timetableClear: (patternId: string, keepFixed: boolean) => Promise<void>

  // TimetablePattern
  patternGetAll: () => Promise<import("./common.types").TimetablePattern[]>
  patternCreate: (data: {
    name?: string
    status?: string
  }) => Promise<import("./common.types").TimetablePattern>
  patternDelete: (id: string) => Promise<void>
  patternAdopt: (
    id: string
  ) => Promise<import("./common.types").TimetablePattern>
  patternGetWithSlots: (
    id: string
  ) => Promise<import("./common.types").TimetablePattern | null>
  patternUpdateScore: (
    id: string,
    data: { violationCount: number; score: number }
  ) => Promise<import("./common.types").TimetablePattern>

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
