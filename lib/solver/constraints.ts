import type {
  ScheduleCondition,
  PerSubjectCondition,
} from "@/types/common.types"
import type {
  Assignment,
  ClassScheduleMap,
  DutyMap,
  KomaLookup,
  RoomAvailabilityMap,
  RoomScheduleMap,
  SlotPosition,
  TeacherAvailabilityMap,
  TeacherScheduleMap,
  Violation,
} from "./types"
import { countTeacherWeekSlots, getTeacherDaySlots } from "./utils"

// 制約チェックコンテキスト
export interface ConstraintContext {
  condition: ScheduleCondition
  perSubjectConditions: PerSubjectCondition[]
  komaLookup: KomaLookup
  teacherAvailMap: TeacherAvailabilityMap
  roomAvailMap: RoomAvailabilityMap
  dutyMap: DutyMap
  teacherMap: TeacherScheduleMap
  classMap: ClassScheduleMap
  roomMap: RoomScheduleMap
  maxPeriodsPerDay: number
  lunchAfterPeriod: number
}

function isActive(level: string): boolean {
  return level !== "ignore"
}

function isForbidden(level: string): boolean {
  return level === "forbidden"
}

// --- 個別制約チェック ---

function checkTeacherAvailability(
  ctx: ConstraintContext,
  komaId: string,
  pos: SlotPosition
): Violation | null {
  if (!isActive(ctx.condition.teacherAvailability)) return null
  const koma = ctx.komaLookup[komaId]
  if (!koma) return null

  for (const tid of koma.teacherIds) {
    const status = ctx.teacherAvailMap[tid]?.[pos.dayOfWeek]?.[pos.period]
    if (status === "unavailable") {
      return {
        type: "teacherAvailability",
        severity: isForbidden(ctx.condition.teacherAvailability)
          ? "error"
          : "warning",
        message: `先生が不可の時間帯です`,
        komaId,
        teacherId: tid,
        dayOfWeek: pos.dayOfWeek,
        period: pos.period,
        weight: ctx.condition.teacherAvailabilityWeight,
      }
    }
  }
  return null
}

function checkTeacherMaxPerDay(
  ctx: ConstraintContext,
  komaId: string,
  pos: SlotPosition
): Violation | null {
  if (!isActive(ctx.condition.teacherMaxPerDay)) return null
  const koma = ctx.komaLookup[komaId]
  if (!koma) return null

  for (const tid of koma.teacherIds) {
    const daySlots = getTeacherDaySlots(ctx.teacherMap, tid, pos.dayOfWeek)
    // +1 for the slot being placed
    const teacherData = findTeacher(ctx, tid)
    if (teacherData && daySlots.length + 1 > teacherData.maxPerDay) {
      return {
        type: "teacherMaxPerDay",
        severity: isForbidden(ctx.condition.teacherMaxPerDay)
          ? "error"
          : "warning",
        message: `先生の1日最大コマ数(${teacherData.maxPerDay})を超過`,
        komaId,
        teacherId: tid,
        dayOfWeek: pos.dayOfWeek,
        period: pos.period,
        weight: ctx.condition.teacherMaxPerDayWeight,
      }
    }
  }
  return null
}

function checkTeacherMaxConsecutive(
  ctx: ConstraintContext,
  komaId: string,
  pos: SlotPosition
): Violation | null {
  if (!isActive(ctx.condition.teacherMaxConsecutive)) return null
  const koma = ctx.komaLookup[komaId]
  if (!koma) return null

  for (const tid of koma.teacherIds) {
    const daySlots = getTeacherDaySlots(ctx.teacherMap, tid, pos.dayOfWeek)
    const allSlots = [...daySlots, pos.period].sort((a, b) => a - b)

    let maxConsec = 1
    let currentConsec = 1
    for (let i = 1; i < allSlots.length; i++) {
      if (allSlots[i] === allSlots[i - 1] + 1) {
        currentConsec++
        maxConsec = Math.max(maxConsec, currentConsec)
      } else {
        currentConsec = 1
      }
    }

    const teacherData = findTeacher(ctx, tid)
    if (teacherData && maxConsec > teacherData.maxConsecutive) {
      return {
        type: "teacherMaxConsecutive",
        severity: isForbidden(ctx.condition.teacherMaxConsecutive)
          ? "error"
          : "warning",
        message: `先生の連続授業数(${teacherData.maxConsecutive})を超過`,
        komaId,
        teacherId: tid,
        dayOfWeek: pos.dayOfWeek,
        period: pos.period,
        weight: ctx.condition.teacherMaxConsecutiveWeight,
      }
    }
  }
  return null
}

function checkTeacherMaxPerWeek(
  ctx: ConstraintContext,
  komaId: string,
  pos: SlotPosition
): Violation | null {
  if (!isActive(ctx.condition.teacherMaxPerWeek)) return null
  const koma = ctx.komaLookup[komaId]
  if (!koma) return null

  for (const tid of koma.teacherIds) {
    const weekCount = countTeacherWeekSlots(ctx.teacherMap, tid)
    const teacherData = findTeacher(ctx, tid)
    if (teacherData && weekCount + 1 > teacherData.maxPeriodsPerWeek) {
      return {
        type: "teacherMaxPerWeek",
        severity: isForbidden(ctx.condition.teacherMaxPerWeek)
          ? "error"
          : "warning",
        message: `先生の週最大コマ数(${teacherData.maxPeriodsPerWeek})を超過`,
        komaId,
        teacherId: tid,
        dayOfWeek: pos.dayOfWeek,
        period: pos.period,
        weight: ctx.condition.teacherMaxPerWeekWeight,
      }
    }
  }
  return null
}

function checkTeacherConflict(
  ctx: ConstraintContext,
  komaId: string,
  pos: SlotPosition
): Violation | null {
  const koma = ctx.komaLookup[komaId]
  if (!koma) return null

  for (const tid of koma.teacherIds) {
    const existing = ctx.teacherMap[tid]?.[pos.dayOfWeek]?.[pos.period]
    if (existing && existing !== komaId) {
      return {
        type: "teacherConflict",
        severity: "error",
        message: `先生が同じ時間帯に別の授業を担当`,
        komaId,
        teacherId: tid,
        dayOfWeek: pos.dayOfWeek,
        period: pos.period,
        weight: 100,
      }
    }
  }
  return null
}

function checkClassConflict(
  ctx: ConstraintContext,
  komaId: string,
  pos: SlotPosition
): Violation | null {
  const koma = ctx.komaLookup[komaId]
  if (!koma) return null

  for (const cid of koma.classIds) {
    const existing = ctx.classMap[cid]?.[pos.dayOfWeek]?.[pos.period]
    if (existing && existing !== komaId) {
      return {
        type: "classConflict",
        severity: "error",
        message: `クラスが同じ時間帯に別の授業`,
        komaId,
        classId: cid,
        dayOfWeek: pos.dayOfWeek,
        period: pos.period,
        weight: 100,
      }
    }
  }
  return null
}

function checkClassSameSubjectPerDay(
  ctx: ConstraintContext,
  komaId: string,
  pos: SlotPosition
): Violation | null {
  if (!isActive(ctx.condition.classSameSubjectPerDay)) return null
  const koma = ctx.komaLookup[komaId]
  if (!koma) return null

  for (const cid of koma.classIds) {
    const dayMap = ctx.classMap[cid]?.[pos.dayOfWeek]
    if (!dayMap) continue
    for (const [, existingKomaId] of Object.entries(dayMap)) {
      if (!existingKomaId || existingKomaId === komaId) continue
      const existingKoma = ctx.komaLookup[existingKomaId]
      if (existingKoma && existingKoma.subjectId === koma.subjectId) {
        return {
          type: "classSameSubjectPerDay",
          severity: isForbidden(ctx.condition.classSameSubjectPerDay)
            ? "error"
            : "warning",
          message: `同一教科が1日に複数回`,
          komaId,
          classId: cid,
          dayOfWeek: pos.dayOfWeek,
          period: pos.period,
          weight: ctx.condition.classSameSubjectPerDayWeight,
        }
      }
    }
  }
  return null
}

function checkClassConsecutiveSame(
  ctx: ConstraintContext,
  komaId: string,
  pos: SlotPosition
): Violation | null {
  if (!isActive(ctx.condition.classConsecutiveSame)) return null
  const koma = ctx.komaLookup[komaId]
  if (!koma) return null

  for (const cid of koma.classIds) {
    const dayMap = ctx.classMap[cid]?.[pos.dayOfWeek]
    if (!dayMap) continue
    // Check adjacent periods
    for (const adj of [pos.period - 1, pos.period + 1]) {
      const adjKomaId = dayMap[adj]
      if (adjKomaId && adjKomaId !== komaId) {
        const adjKoma = ctx.komaLookup[adjKomaId]
        if (adjKoma && adjKoma.subjectId === koma.subjectId) {
          // Allow consecutive type komas to be adjacent
          if (koma.type === "consecutive" || adjKoma.type === "consecutive")
            continue
          return {
            type: "classConsecutiveSame",
            severity: isForbidden(ctx.condition.classConsecutiveSame)
              ? "error"
              : "warning",
            message: `同一教科が連続`,
            komaId,
            classId: cid,
            dayOfWeek: pos.dayOfWeek,
            period: pos.period,
            weight: ctx.condition.classConsecutiveSameWeight,
          }
        }
      }
    }
  }
  return null
}

function checkRoomConflict(
  ctx: ConstraintContext,
  komaId: string,
  pos: SlotPosition
): Violation | null {
  if (!isActive(ctx.condition.roomConflict)) return null
  const koma = ctx.komaLookup[komaId]
  if (!koma) return null

  for (const rid of koma.roomIds) {
    const existing = ctx.roomMap[rid]?.[pos.dayOfWeek]?.[pos.period]
    if (existing && existing !== komaId) {
      return {
        type: "roomConflict",
        severity: isForbidden(ctx.condition.roomConflict) ? "error" : "warning",
        message: `教室が同じ時間帯に使用中`,
        komaId,
        roomId: rid,
        dayOfWeek: pos.dayOfWeek,
        period: pos.period,
        weight: ctx.condition.roomConflictWeight,
      }
    }
  }
  return null
}

function checkRoomAvailability(
  ctx: ConstraintContext,
  komaId: string,
  pos: SlotPosition
): Violation | null {
  if (!isActive(ctx.condition.roomAvailability)) return null
  const koma = ctx.komaLookup[komaId]
  if (!koma) return null

  for (const rid of koma.roomIds) {
    const status = ctx.roomAvailMap[rid]?.[pos.dayOfWeek]?.[pos.period]
    if (status === "unavailable") {
      return {
        type: "roomAvailability",
        severity: isForbidden(ctx.condition.roomAvailability)
          ? "error"
          : "warning",
        message: `教室が利用不可の時間帯`,
        komaId,
        roomId: rid,
        dayOfWeek: pos.dayOfWeek,
        period: pos.period,
        weight: ctx.condition.roomAvailabilityWeight,
      }
    }
  }
  return null
}

function checkDutyConflict(
  ctx: ConstraintContext,
  komaId: string,
  pos: SlotPosition
): Violation | null {
  if (!isActive(ctx.condition.dutyConflict)) return null
  const koma = ctx.komaLookup[komaId]
  if (!koma) return null

  for (const tid of koma.teacherIds) {
    if (ctx.dutyMap[tid]?.[pos.dayOfWeek]?.has(pos.period)) {
      return {
        type: "dutyConflict",
        severity: isForbidden(ctx.condition.dutyConflict) ? "error" : "warning",
        message: `先生の校務時間帯と重複`,
        komaId,
        teacherId: tid,
        dayOfWeek: pos.dayOfWeek,
        period: pos.period,
        weight: ctx.condition.dutyConflictWeight,
      }
    }
  }
  return null
}

function checkConsecutiveKoma(
  ctx: ConstraintContext,
  komaId: string,
  pos: SlotPosition,
  allAssignments: Assignment[]
): Violation | null {
  if (!isActive(ctx.condition.consecutiveKoma)) return null
  const koma = ctx.komaLookup[komaId]
  if (!koma || koma.type !== "consecutive") return null

  // Find other assignments for same koma on same day
  const sameKomaSameDay = allAssignments.filter(
    (a) =>
      a.komaId === komaId &&
      a.dayOfWeek === pos.dayOfWeek &&
      a.period !== pos.period
  )

  if (sameKomaSameDay.length > 0) {
    const isAdjacent = sameKomaSameDay.some(
      (a) => Math.abs(a.period - pos.period) === 1
    )
    if (!isAdjacent) {
      return {
        type: "consecutiveKoma",
        severity: isForbidden(ctx.condition.consecutiveKoma)
          ? "error"
          : "warning",
        message: `連続駒が隣接していません`,
        komaId,
        dayOfWeek: pos.dayOfWeek,
        period: pos.period,
        weight: ctx.condition.consecutiveKomaWeight,
      }
    }
  }
  return null
}

// ヘルパー: 先生データ取得（コンテキストには無いのでlookupにidマップ化）
let _teacherCache: Map<
  string,
  { maxPerDay: number; maxConsecutive: number; maxPeriodsPerWeek: number }
> | null = null
let _teacherCacheInput: unknown = null

function findTeacher(
  ctx: ConstraintContext,
  teacherId: string
): {
  maxPerDay: number
  maxConsecutive: number
  maxPeriodsPerWeek: number
} | null {
  // Simple lookup from komaLookup teacherIds
  // We need teacher data from outside - store it in a simple approach
  return _teacherCache?.get(teacherId) ?? null
}

export function setTeacherCache(
  teachers: {
    id: string
    maxPerDay: number
    maxConsecutive: number
    maxPeriodsPerWeek: number
  }[]
) {
  _teacherCache = new Map()
  for (const t of teachers) {
    _teacherCache.set(t.id, {
      maxPerDay: t.maxPerDay,
      maxConsecutive: t.maxConsecutive,
      maxPeriodsPerWeek: t.maxPeriodsPerWeek,
    })
  }
}

// --- 統合チェック ---

export function checkPlacement(
  ctx: ConstraintContext,
  komaId: string,
  pos: SlotPosition,
  allAssignments: Assignment[] = []
): Violation[] {
  const violations: Violation[] = []

  const checks = [
    checkTeacherConflict(ctx, komaId, pos),
    checkClassConflict(ctx, komaId, pos),
    checkTeacherAvailability(ctx, komaId, pos),
    checkTeacherMaxPerDay(ctx, komaId, pos),
    checkTeacherMaxConsecutive(ctx, komaId, pos),
    checkTeacherMaxPerWeek(ctx, komaId, pos),
    checkClassSameSubjectPerDay(ctx, komaId, pos),
    checkClassConsecutiveSame(ctx, komaId, pos),
    checkRoomConflict(ctx, komaId, pos),
    checkRoomAvailability(ctx, komaId, pos),
    checkDutyConflict(ctx, komaId, pos),
    checkConsecutiveKoma(ctx, komaId, pos, allAssignments),
  ]

  for (const v of checks) {
    if (v) violations.push(v)
  }

  return violations
}

export function isPlacementValid(
  ctx: ConstraintContext,
  komaId: string,
  pos: SlotPosition
): boolean {
  // Quick check: only hard constraints (error severity)
  const koma = ctx.komaLookup[komaId]
  if (!koma) return false

  // Teacher conflict (always hard)
  for (const tid of koma.teacherIds) {
    const existing = ctx.teacherMap[tid]?.[pos.dayOfWeek]?.[pos.period]
    if (existing && existing !== komaId) return false
  }

  // Class conflict (always hard)
  for (const cid of koma.classIds) {
    const existing = ctx.classMap[cid]?.[pos.dayOfWeek]?.[pos.period]
    if (existing && existing !== komaId) return false
  }

  // Teacher availability (if forbidden)
  if (isForbidden(ctx.condition.teacherAvailability)) {
    for (const tid of koma.teacherIds) {
      const status = ctx.teacherAvailMap[tid]?.[pos.dayOfWeek]?.[pos.period]
      if (status === "unavailable") return false
    }
  }

  // Room conflict (if forbidden)
  if (isForbidden(ctx.condition.roomConflict)) {
    for (const rid of koma.roomIds) {
      const existing = ctx.roomMap[rid]?.[pos.dayOfWeek]?.[pos.period]
      if (existing && existing !== komaId) return false
    }
  }

  // Room availability (if forbidden)
  if (isForbidden(ctx.condition.roomAvailability)) {
    for (const rid of koma.roomIds) {
      const status = ctx.roomAvailMap[rid]?.[pos.dayOfWeek]?.[pos.period]
      if (status === "unavailable") return false
    }
  }

  // Duty conflict (if forbidden)
  if (isForbidden(ctx.condition.dutyConflict)) {
    for (const tid of koma.teacherIds) {
      if (ctx.dutyMap[tid]?.[pos.dayOfWeek]?.has(pos.period)) return false
    }
  }

  // Teacher max per day (if forbidden)
  if (isForbidden(ctx.condition.teacherMaxPerDay)) {
    for (const tid of koma.teacherIds) {
      const daySlots = getTeacherDaySlots(ctx.teacherMap, tid, pos.dayOfWeek)
      const teacherData = findTeacher(ctx, tid)
      if (teacherData && daySlots.length + 1 > teacherData.maxPerDay)
        return false
    }
  }

  return true
}

export function evaluateAllConstraints(
  ctx: ConstraintContext,
  assignments: Assignment[]
): Violation[] {
  const violations: Violation[] = []
  for (const a of assignments) {
    const vs = checkPlacement(ctx, a.komaId, a, assignments)
    violations.push(...vs)
  }
  // Deduplicate: unique by type+komaId+day+period
  const seen = new Set<string>()
  return violations.filter((v) => {
    const key = `${v.type}:${v.komaId}:${v.dayOfWeek}:${v.period}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function calculateScore(violations: Violation[]): number {
  return violations.reduce((sum, v) => sum + v.weight, 0)
}
