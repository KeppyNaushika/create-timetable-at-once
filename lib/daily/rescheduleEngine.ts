import type {
  Duty,
  Koma,
  Teacher,
  TeacherAvailability,
  TeacherDutyInfo,
  TimetableSlot,
} from "@/types/common.types"
import type { DailySchedule, RescheduleProposal } from "@/types/daily.types"

interface RescheduleInput {
  originalDate: string
  originalPeriod: number
  originalKomaId: string
  targetDateRange: { start: string; end: string }
  teachers: Teacher[]
  komas: Koma[]
  slots: TimetableSlot[]
  availabilities: TeacherAvailability[]
  duties: Duty[]
  teacherDuties: TeacherDutyInfo[]
  dailySchedules: DailySchedule[]
  daysPerWeek: number
  maxPeriodsPerDay: number
}

/**
 * Parse a "YYYY-MM-DD" string into a Date at midnight UTC.
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
 * Check if a dayOfWeek (0=Sun..6=Sat) is a school day given daysPerWeek.
 */
function isSchoolDay(dayOfWeek: number, daysPerWeek: number): boolean {
  if (dayOfWeek === 0) return false // Sunday is never a school day
  if (daysPerWeek === 5) return dayOfWeek >= 1 && dayOfWeek <= 5
  if (daysPerWeek === 6) return dayOfWeek >= 1 && dayOfWeek <= 6
  return dayOfWeek >= 1 && dayOfWeek <= 5
}

/**
 * Count how many days between two dates (absolute difference in days).
 */
function daysBetween(a: Date, b: Date): number {
  return Math.abs(
    Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24))
  )
}

/**
 * Check if two dates are in the same ISO week.
 */
function isSameWeek(a: Date, b: Date): boolean {
  const getWeekNumber = (d: Date) => {
    const tmp = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7))
    const jan4 = new Date(tmp.getFullYear(), 0, 4)
    return Math.round(
      ((tmp.getTime() - jan4.getTime()) / 86400000 -
        3 +
        ((jan4.getDay() + 6) % 7)) /
        7
    )
  }
  return (
    a.getFullYear() === b.getFullYear() && getWeekNumber(a) === getWeekNumber(b)
  )
}

/**
 * Find reschedule proposals for a cancelled lesson.
 * Returns up to 10 best time slots where the lesson can be rescheduled.
 *
 * Scoring:
 *  - sameWeek        (+30): target date is in the same week as original
 *  - nearDate        (+20): target date is close to original date
 *  - morningSlot     (+10): period <= 3 (morning)
 *  - lowTeacherLoad  (+20): teachers have fewer periods that day
 *  - noConflicts     (+20): no conflicts at all (always true for returned proposals)
 */
export function findRescheduleProposals(
  input: RescheduleInput
): RescheduleProposal[] {
  const {
    originalDate,
    originalKomaId,
    targetDateRange,
    teachers,
    komas,
    slots,
    availabilities,
    duties,
    teacherDuties,
    dailySchedules,
    daysPerWeek,
    maxPeriodsPerDay,
  } = input

  // 1. Get the original koma's teachers and classes
  const originalKoma = komas.find((k) => k.id === originalKomaId)
  if (!originalKoma) return []

  const komaTeacherIds = (originalKoma.komaTeachers ?? []).map(
    (kt) => kt.teacherId
  )
  const komaClassIds = (originalKoma.komaClasses ?? []).map((kc) => kc.classId)

  const originalDateObj = parseDate(originalDate)
  const startDate = parseDate(targetDateRange.start)
  const endDate = parseDate(targetDateRange.end)

  // Count average teacher load per day for scoring
  const teacherDayLoads = new Map<string, Map<number, number>>() // teacherId -> dayOfWeek -> count
  for (const slot of slots) {
    const slotKoma = komas.find((k) => k.id === slot.komaId)
    if (!slotKoma) continue
    for (const kt of slotKoma.komaTeachers ?? []) {
      if (!teacherDayLoads.has(kt.teacherId)) {
        teacherDayLoads.set(kt.teacherId, new Map())
      }
      const dayMap = teacherDayLoads.get(kt.teacherId)!
      dayMap.set(slot.dayOfWeek, (dayMap.get(slot.dayOfWeek) ?? 0) + 1)
    }
  }

  const proposals: RescheduleProposal[] = []

  // 2. Iterate each date in range
  const current = new Date(startDate)
  while (current <= endDate) {
    const dateStr = formatDate(current)
    const dayOfWeek = current.getDay()

    // Skip non-school days
    if (!isSchoolDay(dayOfWeek, daysPerWeek)) {
      current.setDate(current.getDate() + 1)
      continue
    }

    // Skip holiday/event days
    const daySchedule = dailySchedules.find((ds) => ds.date === dateStr)
    if (
      daySchedule &&
      (daySchedule.scheduleType === "holiday" ||
        daySchedule.scheduleType === "event")
    ) {
      current.setDate(current.getDate() + 1)
      continue
    }

    // For each period
    for (let period = 1; period <= maxPeriodsPerDay; period++) {
      const conflicts: string[] = []
      let hasConflict = false

      // Check all teachers are free
      for (const teacherId of komaTeacherIds) {
        // Availability conflict
        const unavail = availabilities.find(
          (a) =>
            a.teacherId === teacherId &&
            a.dayOfWeek === dayOfWeek &&
            a.period === period &&
            a.status === "unavailable"
        )
        if (unavail) {
          const teacher = teachers.find((t) => t.id === teacherId)
          conflicts.push(`${teacher?.name ?? teacherId}はこの時間帯に出勤不可`)
          hasConflict = true
        }

        // Duty conflict
        const dutyConflict = duties.find(
          (d) =>
            d.dayOfWeek === dayOfWeek &&
            d.period === period &&
            teacherDuties.some(
              (td) => td.dutyId === d.id && td.teacherId === teacherId
            )
        )
        if (dutyConflict) {
          const teacher = teachers.find((t) => t.id === teacherId)
          conflicts.push(
            `${teacher?.name ?? teacherId}は校務「${dutyConflict.name}」あり`
          )
          hasConflict = true
        }

        // Existing slot conflict
        const slotConflict = slots.some((s) => {
          if (s.dayOfWeek !== dayOfWeek || s.period !== period) return false
          const slotKoma = komas.find((k) => k.id === s.komaId)
          if (!slotKoma) return false
          return (slotKoma.komaTeachers ?? []).some(
            (kt) => kt.teacherId === teacherId
          )
        })
        if (slotConflict) {
          const teacher = teachers.find((t) => t.id === teacherId)
          conflicts.push(
            `${teacher?.name ?? teacherId}は別の授業が入っています`
          )
          hasConflict = true
        }
      }

      // Check all classes are free
      for (const classId of komaClassIds) {
        const classConflict = slots.some((s) => {
          if (s.dayOfWeek !== dayOfWeek || s.period !== period) return false
          const slotKoma = komas.find((k) => k.id === s.komaId)
          if (!slotKoma) return false
          return (slotKoma.komaClasses ?? []).some(
            (kc) => kc.classId === classId
          )
        })
        if (classConflict) {
          conflicts.push(`クラスに別の授業が入っています`)
          hasConflict = true
        }
      }

      if (hasConflict) {
        current.setDate(current.getDate() + 0) // don't advance, we're in the period loop
        continue
      }

      // Score the proposal
      let score = 0
      const reasons: string[] = []

      // noConflicts (+20)
      score += 20
      reasons.push("競合なし")

      // sameWeek (+30)
      if (isSameWeek(current, originalDateObj)) {
        score += 30
        reasons.push("同じ週内")
      }

      // nearDate (+20) - within 7 days gets full score, linear decay
      const distance = daysBetween(current, originalDateObj)
      if (distance <= 7) {
        score += 20
        reasons.push(`元の日から${distance}日以内`)
      } else if (distance <= 14) {
        score += 10
        reasons.push(`元の日から${distance}日`)
      }

      // morningSlot (+10)
      if (period <= 3) {
        score += 10
        reasons.push("午前中の時間帯")
      }

      // lowTeacherLoad (+20)
      let totalLoad = 0
      for (const teacherId of komaTeacherIds) {
        const dayMap = teacherDayLoads.get(teacherId)
        totalLoad += dayMap?.get(dayOfWeek) ?? 0
      }
      const avgTeacherLoad =
        komaTeacherIds.length > 0 ? totalLoad / komaTeacherIds.length : 0
      if (avgTeacherLoad < maxPeriodsPerDay * 0.6) {
        score += 20
        reasons.push("担当教師の負荷が低い日")
      }

      proposals.push({
        targetDate: dateStr,
        targetPeriod: period,
        targetDayOfWeek: dayOfWeek,
        score,
        reasons,
        conflicts,
      })
    }

    current.setDate(current.getDate() + 1)
  }

  // Sort by score descending
  proposals.sort((a, b) => b.score - a.score)

  // Return top 10
  return proposals.slice(0, 10)
}
