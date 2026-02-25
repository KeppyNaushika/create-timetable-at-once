import type {
  Duty,
  Koma,
  Teacher,
  TeacherAvailability,
  TeacherDutyInfo,
  TimetableSlot,
} from "@/types/common.types"
import type { DailyChange, SubstituteCandidate } from "@/types/daily.types"

interface SubstituteInput {
  targetDate: string // date of absence
  targetPeriod: number // period needing substitute
  targetClassId: string // class needing substitute
  originalKomaId: string // the koma that needs a substitute teacher
  teachers: Teacher[]
  komas: Koma[]
  slots: TimetableSlot[] // adopted pattern slots
  availabilities: TeacherAvailability[]
  duties: Duty[]
  teacherDuties: TeacherDutyInfo[]
  existingChanges: DailyChange[] // already assigned changes that day
}

/**
 * dayOfWeek from date string: 0=Sun,1=Mon,...,6=Sat
 */
function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr).getDay()
}

/**
 * Find substitute teacher candidates for a class period where the original
 * teacher is absent.
 *
 * Scoring:
 *  - sameSubject  (+40): candidate's mainSubjectId matches the koma's subjectId
 *  - isAvailable  (+20): no conflict at this time slot
 *  - lowLoad      (+20): teacher has fewer than average periods that day
 *  - fairness     (+20): teacher has done fewer substitutions (from existingChanges)
 */
export function findSubstituteCandidates(
  input: SubstituteInput
): SubstituteCandidate[] {
  const {
    targetDate,
    targetPeriod,
    targetClassId: _targetClassId,
    originalKomaId,
    teachers,
    komas,
    slots,
    availabilities,
    duties,
    teacherDuties,
    existingChanges,
  } = input

  // 1. Find the original koma to get subject info and original teacher(s)
  const originalKoma = komas.find((k) => k.id === originalKomaId)
  if (!originalKoma) return []

  const subjectId = originalKoma.subjectId
  const originalTeacherIds = new Set(
    (originalKoma.komaTeachers ?? []).map((kt) => kt.teacherId)
  )

  const dayOfWeek = getDayOfWeek(targetDate)

  // Build a map of how many substitutions each teacher already has
  const substitutionCounts = new Map<string, number>()
  for (const change of existingChanges) {
    if (change.substituteTeacherId) {
      substitutionCounts.set(
        change.substituteTeacherId,
        (substitutionCounts.get(change.substituteTeacherId) ?? 0) + 1
      )
    }
  }

  // Count each teacher's periods on this day of week (from slots)
  const teacherDayLoad = new Map<string, number>()
  for (const slot of slots) {
    if (slot.dayOfWeek !== dayOfWeek) continue
    const slotKoma = komas.find((k) => k.id === slot.komaId)
    if (!slotKoma) continue
    for (const kt of slotKoma.komaTeachers ?? []) {
      teacherDayLoad.set(
        kt.teacherId,
        (teacherDayLoad.get(kt.teacherId) ?? 0) + 1
      )
    }
  }

  // Compute average day load
  const loadValues = Array.from(teacherDayLoad.values())
  const avgLoad =
    loadValues.length > 0
      ? loadValues.reduce((a, b) => a + b, 0) / loadValues.length
      : 0

  // Average substitution count
  const subCounts = Array.from(substitutionCounts.values())
  const avgSubCount =
    subCounts.length > 0
      ? subCounts.reduce((a, b) => a + b, 0) / subCounts.length
      : 0

  const candidates: SubstituteCandidate[] = []

  for (const teacher of teachers) {
    // Exclude the absent (original) teacher(s)
    if (originalTeacherIds.has(teacher.id)) continue

    const reasons: string[] = []
    let score = 0

    // a. Check availability conflicts
    const unavailable = availabilities.find(
      (a) =>
        a.teacherId === teacher.id &&
        a.dayOfWeek === dayOfWeek &&
        a.period === targetPeriod &&
        a.status === "unavailable"
    )

    // Check duty conflict
    const hasDuty = duties.some(
      (d) =>
        d.dayOfWeek === dayOfWeek &&
        d.period === targetPeriod &&
        teacherDuties.some(
          (td) => td.dutyId === d.id && td.teacherId === teacher.id
        )
    )

    // Check if teacher already has a class at this slot
    const hasExistingSlot = slots.some((s) => {
      if (s.dayOfWeek !== dayOfWeek || s.period !== targetPeriod) return false
      const slotKoma = komas.find((k) => k.id === s.komaId)
      if (!slotKoma) return false
      return (slotKoma.komaTeachers ?? []).some(
        (kt) => kt.teacherId === teacher.id
      )
    })

    // Check if teacher is already assigned a substitute at this time
    const hasExistingChange = existingChanges.some(
      (c) => c.substituteTeacherId === teacher.id && c.period === targetPeriod
    )

    const teacherIsAvailable =
      !unavailable && !hasDuty && !hasExistingSlot && !hasExistingChange

    // If teacher is not available at all, skip
    if (!teacherIsAvailable) continue

    // isAvailable (+20)
    score += 20
    reasons.push("この時間帯に空きがあります")

    // sameSubject (+40)
    const isSameSubject = teacher.mainSubjectId === subjectId
    if (isSameSubject) {
      score += 40
      reasons.push("同じ教科の担当です")
    }

    // lowLoad (+20)
    const currentLoad = teacherDayLoad.get(teacher.id) ?? 0
    if (currentLoad < avgLoad) {
      score += 20
      reasons.push(`当日の授業数が平均以下です (${currentLoad}コマ)`)
    }

    // fairness (+20)
    const subCount = substitutionCounts.get(teacher.id) ?? 0
    if (subCount <= avgSubCount) {
      score += 20
      reasons.push(`補欠回数が少なめです (${subCount}回)`)
    }

    candidates.push({
      teacherId: teacher.id,
      teacherName: teacher.name,
      score,
      reasons,
      isSameSubject,
      isAvailable: teacherIsAvailable,
      currentLoad,
    })
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score)

  return candidates
}
