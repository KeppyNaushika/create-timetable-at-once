import type {
  Koma,
  TimetableSlot,
  ClassInfo,
  Subject,
  Teacher,
} from "@/types/common.types"
import type {
  DailyChange,
  DailySchedule,
  HourCountRow,
  HourCountByTeacherRow,
} from "@/types/daily.types"

interface HourCountInput {
  slots: TimetableSlot[]
  komas: Koma[]
  classes: ClassInfo[]
  subjects: Subject[]
  teachers: Teacher[]
  dailySchedules?: DailySchedule[]
  dailyChanges?: DailyChange[]
}

/**
 * Composite key for subject+class.
 */
function scKey(subjectId: string, classId: string): string {
  return `${subjectId}::${classId}`
}

/**
 * Calculate planned hours per week for each subject+class combination.
 *
 * For each koma, the planned count equals koma.count (weekly slots needed).
 * Each koma may span multiple classes (via komaClasses), so it produces one
 * row per class.
 */
export function calculatePlannedHours(input: HourCountInput): HourCountRow[] {
  const { komas, classes, subjects } = input

  const map = new Map<
    string,
    { subjectId: string; classId: string; planned: number }
  >()

  for (const koma of komas) {
    const komaClasses = koma.komaClasses ?? []
    for (const kc of komaClasses) {
      const key = scKey(koma.subjectId, kc.classId)
      const existing = map.get(key)
      if (existing) {
        existing.planned += koma.count
      } else {
        map.set(key, {
          subjectId: koma.subjectId,
          classId: kc.classId,
          planned: koma.count,
        })
      }
    }
  }

  const rows: HourCountRow[] = []
  for (const entry of map.values()) {
    const subject = subjects.find((s) => s.id === entry.subjectId)
    const cls = classes.find((c) => c.id === entry.classId)
    rows.push({
      subjectId: entry.subjectId,
      subjectName: subject?.name ?? "",
      classId: entry.classId,
      className: cls?.name ?? "",
      planned: entry.planned,
      actual: 0,
      diff: -entry.planned,
    })
  }

  return rows
}

/**
 * Calculate actual hours: count placed slots per koma, adjusted by
 * daily changes (cancellations reduce count, substitutions preserve it).
 */
export function calculateActualHours(input: HourCountInput): HourCountRow[] {
  const { slots, komas, classes, subjects, dailyChanges } = input

  // Count slots per koma
  const slotCountByKoma = new Map<string, number>()
  for (const slot of slots) {
    slotCountByKoma.set(
      slot.komaId,
      (slotCountByKoma.get(slot.komaId) ?? 0) + 1
    )
  }

  // Count cancellations per koma (changes that cancel a lesson)
  const cancelCountByKoma = new Map<string, number>()
  if (dailyChanges) {
    for (const change of dailyChanges) {
      if (change.changeType === "cancel" && change.originalKomaId) {
        cancelCountByKoma.set(
          change.originalKomaId,
          (cancelCountByKoma.get(change.originalKomaId) ?? 0) + 1
        )
      }
    }
  }

  // Build actual map: subject+class -> actual count
  const map = new Map<
    string,
    { subjectId: string; classId: string; actual: number }
  >()

  for (const koma of komas) {
    const komaClasses = koma.komaClasses ?? []
    const slotCount = slotCountByKoma.get(koma.id) ?? 0
    const cancelCount = cancelCountByKoma.get(koma.id) ?? 0
    const actual = Math.max(0, slotCount - cancelCount)

    for (const kc of komaClasses) {
      const key = scKey(koma.subjectId, kc.classId)
      const existing = map.get(key)
      if (existing) {
        existing.actual += actual
      } else {
        map.set(key, {
          subjectId: koma.subjectId,
          classId: kc.classId,
          actual,
        })
      }
    }
  }

  const rows: HourCountRow[] = []
  for (const entry of map.values()) {
    const subject = subjects.find((s) => s.id === entry.subjectId)
    const cls = classes.find((c) => c.id === entry.classId)
    rows.push({
      subjectId: entry.subjectId,
      subjectName: subject?.name ?? "",
      classId: entry.classId,
      className: cls?.name ?? "",
      planned: 0,
      actual: entry.actual,
      diff: entry.actual,
    })
  }

  return rows
}

/**
 * Merge planned and actual rows, computing diff = actual - planned.
 */
export function calculateHourDiff(
  planned: HourCountRow[],
  actual: HourCountRow[]
): HourCountRow[] {
  const map = new Map<string, HourCountRow>()

  for (const row of planned) {
    const key = scKey(row.subjectId, row.classId)
    map.set(key, { ...row, actual: 0, diff: -row.planned })
  }

  for (const row of actual) {
    const key = scKey(row.subjectId, row.classId)
    const existing = map.get(key)
    if (existing) {
      existing.actual = row.actual
      existing.diff = row.actual - existing.planned
    } else {
      map.set(key, { ...row, planned: 0, diff: row.actual })
    }
  }

  return Array.from(map.values())
}

/**
 * Calculate hours grouped by teacher.
 *
 * For each koma, distribute planned (koma.count) and actual (slot count minus
 * cancellations) to each teacher linked via komaTeachers.
 */
export function calculateTeacherHours(
  input: HourCountInput
): HourCountByTeacherRow[] {
  const { slots, komas, teachers, dailyChanges } = input

  // Count slots per koma
  const slotCountByKoma = new Map<string, number>()
  for (const slot of slots) {
    slotCountByKoma.set(
      slot.komaId,
      (slotCountByKoma.get(slot.komaId) ?? 0) + 1
    )
  }

  // Count cancellations per koma
  const cancelCountByKoma = new Map<string, number>()
  if (dailyChanges) {
    for (const change of dailyChanges) {
      if (change.changeType === "cancel" && change.originalKomaId) {
        cancelCountByKoma.set(
          change.originalKomaId,
          (cancelCountByKoma.get(change.originalKomaId) ?? 0) + 1
        )
      }
    }
  }

  const teacherMap = new Map<
    string,
    { planned: number; actual: number }
  >()

  for (const koma of komas) {
    const komaTeachers = koma.komaTeachers ?? []
    const slotCount = slotCountByKoma.get(koma.id) ?? 0
    const cancelCount = cancelCountByKoma.get(koma.id) ?? 0
    const actual = Math.max(0, slotCount - cancelCount)

    for (const kt of komaTeachers) {
      const existing = teacherMap.get(kt.teacherId)
      if (existing) {
        existing.planned += koma.count
        existing.actual += actual
      } else {
        teacherMap.set(kt.teacherId, {
          planned: koma.count,
          actual,
        })
      }
    }
  }

  const rows: HourCountByTeacherRow[] = []
  for (const [teacherId, data] of teacherMap) {
    const teacher = teachers.find((t) => t.id === teacherId)
    rows.push({
      teacherId,
      teacherName: teacher?.name ?? "",
      planned: data.planned,
      actual: data.actual,
      diff: data.actual - data.planned,
    })
  }

  return rows
}
