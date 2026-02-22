export interface School {
  id: string
  name: string
  academicYear: number
  classCountsJson: string
  namingConvention: string
  daysPerWeek: number
  maxPeriodsPerDay: number
  hasZeroPeriod: boolean
  periodNamesJson: string
  periodLengthsJson: string
  lunchAfterPeriod: number
  createdAt: string
  updatedAt: string
}

export interface Grade {
  id: string
  gradeNum: number
  name: string
  classes?: ClassInfo[]
  createdAt: string
  updatedAt: string
}

export interface ClassInfo {
  id: string
  gradeId: string
  name: string
  sortOrder: number
  grade?: Grade
  createdAt: string
  updatedAt: string
}

export interface Teacher {
  id: string
  name: string
  nameKana: string
  mainSubjectId: string | null
  maxConsecutive: number
  maxPerDay: number
  maxPeriodsPerWeek: number
  notes: string
  availabilities?: TeacherAvailability[]
  teacherDuties?: TeacherDutyInfo[]
  createdAt: string
  updatedAt: string
}

export interface TeacherAvailability {
  id: string
  teacherId: string
  dayOfWeek: number
  period: number
  status: string // "available" | "unavailable" | "preferred"
  createdAt: string
  updatedAt: string
}

export interface Subject {
  id: string
  name: string
  shortName: string
  color: string
  category: string // "general" | "reserve" | "school_affair"
  sortOrder: number
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface SpecialRoom {
  id: string
  name: string
  shortName: string
  capacity: number
  notes: string
  sortOrder: number
  availabilities?: RoomAvailability[]
  createdAt: string
  updatedAt: string
}

export interface RoomAvailability {
  id: string
  roomId: string
  dayOfWeek: number
  period: number
  status: string // "available" | "unavailable"
  createdAt: string
  updatedAt: string
}

export interface Duty {
  id: string
  name: string
  shortName: string
  dayOfWeek: number
  period: number
  sortOrder: number
  teacherDuties?: TeacherDutyInfo[]
  createdAt: string
  updatedAt: string
}

export interface TeacherDutyInfo {
  id: string
  dutyId: string
  teacherId: string
  teacher?: Teacher
  duty?: Duty
  createdAt: string
  updatedAt: string
}

export interface Koma {
  id: string
  subjectId: string
  gradeId: string
  type: string // "normal" | "consecutive"
  count: number
  priority: number
  label: string
  subject?: Subject
  grade?: Grade
  komaTeachers?: KomaTeacher[]
  komaClasses?: KomaClass[]
  komaRooms?: KomaRoom[]
  createdAt: string
  updatedAt: string
}

export interface KomaTeacher {
  id: string
  komaId: string
  teacherId: string
  role: string // "main" | "sub"
  teacher?: Teacher
  createdAt: string
  updatedAt: string
}

export interface KomaClass {
  id: string
  komaId: string
  classId: string
  class_?: ClassInfo
  createdAt: string
  updatedAt: string
}

export interface KomaRoom {
  id: string
  komaId: string
  roomId: string
  room?: SpecialRoom
  createdAt: string
  updatedAt: string
}

export interface SchoolWithGrades extends School {
  grades: Grade[]
}

// ClassCounts: gradeNum -> classCount
export type ClassCounts = Record<string, number>
