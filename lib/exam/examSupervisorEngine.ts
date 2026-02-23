import type {
  Teacher,
  Koma,
  Subject,
  ClassInfo,
} from "@/types/common.types"
import type {
  ExamSchedule,
  ExamAssignment,
  SupervisorCandidate,
} from "@/types/exam.types"

interface ExamAssignInput {
  examSchedule: ExamSchedule
  teachers: Teacher[]
  komas: Koma[]
  subjects: Subject[]
  classes: ClassInfo[]
  existingAssignments: ExamAssignment[]
}

/**
 * Parse a "YYYY-MM-DD" string into a Date.
 */
function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Format a Date as "YYYY-MM-DD".
 */
function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/**
 * Parse subjectsJson to get exam subject schedule.
 * Expected format: array of { date: string, period: number, subjectId: string }
 */
interface ExamSubjectEntry {
  date: string
  period: number
  subjectId: string
}

function parseExamSubjects(json: string): ExamSubjectEntry[] {
  try {
    return JSON.parse(json) as ExamSubjectEntry[]
  } catch {
    return []
  }
}

/**
 * Get supervisor candidates for a specific exam slot.
 *
 * Scoring:
 *  - isSubjectTeacher (+50): teaches this subject to this class via koma
 *  - isSameSubjectTeacher (+30): teaches this subject to any class
 *  - isAvailable (+20): no other assignment at same time
 *  - loadBalance (+20): fewer assignments so far
 */
export function getSupervisorCandidates(input: {
  date: string
  period: number
  subjectId: string
  classId: string
  teachers: Teacher[]
  komas: Koma[]
  existingAssignments: ExamAssignment[]
}): SupervisorCandidate[] {
  const {
    date,
    period,
    subjectId,
    classId,
    teachers,
    komas,
    existingAssignments,
  } = input

  // Count existing assignments per teacher
  const assignmentCounts = new Map<string, number>()
  for (const assignment of existingAssignments) {
    assignmentCounts.set(
      assignment.supervisorId,
      (assignmentCounts.get(assignment.supervisorId) ?? 0) + 1
    )
  }

  // Average assignment count
  const counts = Array.from(assignmentCounts.values())
  const avgCount =
    counts.length > 0 ? counts.reduce((a, b) => a + b, 0) / counts.length : 0

  // Find teachers who teach this subject to this class
  const subjectTeachersForClass = new Set<string>()
  const subjectTeachersAny = new Set<string>()

  for (const koma of komas) {
    if (koma.subjectId !== subjectId) continue
    const komaTeacherIds = (koma.komaTeachers ?? []).map((kt) => kt.teacherId)
    const komaClassIds = (koma.komaClasses ?? []).map((kc) => kc.classId)

    for (const tid of komaTeacherIds) {
      subjectTeachersAny.add(tid)
      if (komaClassIds.includes(classId)) {
        subjectTeachersForClass.add(tid)
      }
    }
  }

  // Check who is busy at this date+period
  const busyTeachers = new Set<string>()
  for (const assignment of existingAssignments) {
    if (assignment.date === date && assignment.period === period) {
      busyTeachers.add(assignment.supervisorId)
    }
  }

  const candidates: SupervisorCandidate[] = []

  for (const teacher of teachers) {
    let score = 0
    const reasons: string[] = []

    const isSubjectTeacher = subjectTeachersForClass.has(teacher.id)
    const isSameSubjectTeacher = subjectTeachersAny.has(teacher.id)
    const isAvailable = !busyTeachers.has(teacher.id)
    const currentCount = assignmentCounts.get(teacher.id) ?? 0

    // Skip unavailable teachers
    if (!isAvailable) continue

    // isAvailable (+20)
    score += 20
    reasons.push("この時間帯に空きがあります")

    // isSubjectTeacher (+50)
    if (isSubjectTeacher) {
      score += 50
      reasons.push("このクラスの教科担当です")
    }

    // isSameSubjectTeacher (+30) - only if not already subject teacher for this class
    if (isSameSubjectTeacher && !isSubjectTeacher) {
      score += 30
      reasons.push("同じ教科の担当です（別クラス）")
    }

    // loadBalance (+20)
    if (currentCount <= avgCount) {
      score += 20
      reasons.push(`監督回数が少なめです (${currentCount}回)`)
    }

    candidates.push({
      teacherId: teacher.id,
      teacherName: teacher.name,
      score,
      reasons,
      isSubjectTeacher,
      isSameSubjectTeacher,
      isAvailable,
      currentAssignmentCount: currentCount,
    })
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score)

  return candidates
}

/**
 * Auto-assign supervisors for all unassigned exam slots.
 *
 * Algorithm:
 * 1. Parse examSchedule.subjectsJson to get subject list
 * 2. For each date/period/class, if not already assigned, find candidates
 * 3. Assign top candidate (greedy)
 * 4. Track assignment counts for load balancing
 */
export function autoAssignSupervisors(
  input: ExamAssignInput
): ExamAssignment[] {
  const {
    examSchedule,
    teachers,
    komas,
    subjects,
    classes,
    existingAssignments,
  } = input

  const examSubjects = parseExamSubjects(examSchedule.subjectsJson)
  if (examSubjects.length === 0) return [...existingAssignments]

  // Work with a mutable copy of assignments
  const assignments = [...existingAssignments]

  // Build a set of already-assigned slots for quick lookup
  const assignedSet = new Set<string>()
  for (const a of assignments) {
    assignedSet.add(`${a.date}::${a.period}::${a.classId}`)
  }

  // For each exam subject entry, assign supervisors for all classes
  for (const entry of examSubjects) {
    for (const cls of classes) {
      const slotKey = `${entry.date}::${entry.period}::${cls.id}`

      // Skip if already assigned
      if (assignedSet.has(slotKey)) continue

      // Get candidates
      const candidates = getSupervisorCandidates({
        date: entry.date,
        period: entry.period,
        subjectId: entry.subjectId,
        classId: cls.id,
        teachers,
        komas,
        existingAssignments: assignments,
      })

      if (candidates.length === 0) continue

      // Assign top candidate
      const best = candidates[0]
      const newAssignment: ExamAssignment = {
        id: `auto_${entry.date}_${entry.period}_${cls.id}`,
        examScheduleId: examSchedule.id,
        date: entry.date,
        period: entry.period,
        subjectId: entry.subjectId,
        classId: cls.id,
        supervisorId: best.teacherId,
        assignedBy: "auto",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      assignments.push(newAssignment)
      assignedSet.add(slotKey)
    }
  }

  return assignments
}
