export interface DailySchedule {
  id: string
  date: string // "YYYY-MM-DD"
  scheduleType: string // "normal" | "shortened" | "exam" | "event" | "holiday" | "custom"
  periodsCount: number | null
  reason: string
  notes: string
  changes?: DailyChange[]
  createdAt: string
  updatedAt: string
}

export interface DailyChange {
  id: string
  dailyScheduleId: string
  classId: string
  period: number
  changeType: string // "cancel" | "substitute" | "swap" | "special" | "self_study"
  originalKomaId: string | null
  substituteTeacherId: string | null
  rescheduleDate: string | null
  reschedulePeriod: number | null
  notes: string
  createdAt: string
  updatedAt: string
}

export interface SchoolEvent {
  id: string
  date: string // "YYYY-MM-DD"
  eventType: string // "holiday" | "national_holiday" | "school_event" | "exam" | "ceremony" | "other"
  name: string
  isAllDay: boolean
  affectedPeriods: number
  notes: string
  createdAt: string
  updatedAt: string
}

export interface SubstituteCandidate {
  teacherId: string
  teacherName: string
  score: number
  reasons: string[]
  isSameSubject: boolean
  isAvailable: boolean
  currentLoad: number
}

export interface RescheduleProposal {
  targetDate: string
  targetPeriod: number
  targetDayOfWeek: number
  score: number
  reasons: string[]
  conflicts: string[]
}

export interface HourCountRow {
  subjectId: string
  subjectName: string
  classId: string
  className: string
  planned: number
  actual: number
  diff: number
}

export interface HourCountByTeacherRow {
  teacherId: string
  teacherName: string
  planned: number
  actual: number
  diff: number
}
