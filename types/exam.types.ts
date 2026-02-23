export interface ExamSchedule {
  id: string
  name: string
  startDate: string // "YYYY-MM-DD"
  endDate: string // "YYYY-MM-DD"
  subjectsJson: string
  notes: string
  assignments?: ExamAssignment[]
  createdAt: string
  updatedAt: string
}

export interface ExamAssignment {
  id: string
  examScheduleId: string
  date: string
  period: number
  subjectId: string
  classId: string
  supervisorId: string
  assignedBy: string // "auto" | "manual"
  createdAt: string
  updatedAt: string
}

export interface SupervisorCandidate {
  teacherId: string
  teacherName: string
  score: number
  reasons: string[]
  isSubjectTeacher: boolean
  isSameSubjectTeacher: boolean
  isAvailable: boolean
  currentAssignmentCount: number
}

export interface ElectiveStudent {
  id: string
  name: string
  choices: string[] // 選択科目名の配列
}

export interface ElectiveGroup {
  subjectName: string
  students: string[] // student IDs
  period: number
  teacherId?: string
}

export interface ElectiveResult {
  groups: ElectiveGroup[]
  unassigned: string[]
  score: number
}

export interface AppSetting {
  id: string
  key: string
  value: string
  createdAt: string
  updatedAt: string
}
