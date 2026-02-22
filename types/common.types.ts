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
  maxPeriodsPerWeek: number
  notes: string
  availabilities?: TeacherAvailability[]
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

export interface SchoolWithGrades extends School {
  grades: Grade[]
}

// ClassCounts: gradeNum -> classCount
export type ClassCounts = Record<string, number>
