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
import { countTeacherWeekSlots, getTeacherDaySlots, buildScheduleMaps } from "./utils"

const HARD_COST = 100000

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

function resolveWeight(level: string, configWeight: number): number {
  return isForbidden(level) ? HARD_COST : configWeight
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
        weight: resolveWeight(ctx.condition.teacherAvailability, ctx.condition.teacherAvailabilityWeight),
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
        weight: resolveWeight(ctx.condition.teacherMaxPerDay, ctx.condition.teacherMaxPerDayWeight),
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
        weight: resolveWeight(ctx.condition.teacherMaxConsecutive, ctx.condition.teacherMaxConsecutiveWeight),
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
        weight: resolveWeight(ctx.condition.teacherMaxPerWeek, ctx.condition.teacherMaxPerWeekWeight),
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
        weight: HARD_COST,
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
        weight: HARD_COST,
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

  // 教科別条件が設定済みの教科はスキップ（perSubjectMaxPerDay に任せる）
  if (ctx.perSubjectConditions.some((c) => c.subjectId === koma.subjectId)) return null

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
          weight: resolveWeight(ctx.condition.classSameSubjectPerDay, ctx.condition.classSameSubjectPerDayWeight),
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
            weight: resolveWeight(ctx.condition.classConsecutiveSame, ctx.condition.classConsecutiveSameWeight),
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
        weight: resolveWeight(ctx.condition.roomConflict, ctx.condition.roomConflictWeight),
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
        weight: resolveWeight(ctx.condition.roomAvailability, ctx.condition.roomAvailabilityWeight),
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
        weight: resolveWeight(ctx.condition.dutyConflict, ctx.condition.dutyConflictWeight),
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
        weight: resolveWeight(ctx.condition.consecutiveKoma, ctx.condition.consecutiveKomaWeight),
      }
    }
  }
  return null
}

function checkDailyBalance(
  ctx: ConstraintContext,
  komaId: string,
  pos: SlotPosition
): Violation | null {
  if (!isActive(ctx.condition.dailyBalance)) return null
  const koma = ctx.komaLookup[komaId]
  if (!koma) return null

  // 先生ごとに曜日間のコマ数差を確認
  for (const tid of koma.teacherIds) {
    const days = ctx.teacherMap[tid]
    if (!days) continue

    const dayCounts: number[] = []
    for (let d = 0; d < 6; d++) {
      const dayMap = days[d]
      if (!dayMap) {
        dayCounts.push(0)
        continue
      }
      dayCounts.push(
        Object.values(dayMap).filter((v) => v != null).length
      )
    }
    // 配置先の曜日に+1
    dayCounts[pos.dayOfWeek] = (dayCounts[pos.dayOfWeek] ?? 0) + 1

    const activeDays = dayCounts.filter((c) => c > 0)
    if (activeDays.length < 2) continue

    const max = Math.max(...activeDays)
    const min = Math.min(...activeDays)
    // 差が2以上で違反
    if (max - min >= 2) {
      return {
        type: "dailyBalance",
        severity: isForbidden(ctx.condition.dailyBalance) ? "error" : "warning",
        message: `先生の曜日間コマ数差(${max - min})が大きい`,
        komaId,
        teacherId: tid,
        dayOfWeek: pos.dayOfWeek,
        period: pos.period,
        weight: resolveWeight(ctx.condition.dailyBalance, ctx.condition.dailyBalanceWeight),
      }
    }
  }
  return null
}

function checkPerSubjectPlacement(
  ctx: ConstraintContext,
  komaId: string,
  pos: SlotPosition
): Violation | null {
  if (ctx.perSubjectConditions.length === 0) return null
  const koma = ctx.komaLookup[komaId]
  if (!koma) return null

  const psc = ctx.perSubjectConditions.find(
    (c) => c.subjectId === koma.subjectId
  )
  if (!psc || psc.placementRestriction === "any") return null
  if (psc.level === "ignore") return null

  const period = pos.period
  const isMorning = period <= ctx.lunchAfterPeriod
  const isFirstPeriod = period === 1
  const isLastPeriod = period === ctx.maxPeriodsPerDay

  let violated = false
  let message = ""

  switch (psc.placementRestriction) {
    case "morning_only":
      if (!isMorning) {
        violated = true
        message = `教科が午前のみに制限されています`
      }
      break
    case "afternoon_only":
      if (isMorning) {
        violated = true
        message = `教科が午後のみに制限されています`
      }
      break
    case "not_first":
      if (isFirstPeriod) {
        violated = true
        message = `教科が1時限目不可に設定されています`
      }
      break
    case "not_last":
      if (isLastPeriod) {
        violated = true
        message = `教科が最終時限不可に設定されています`
      }
      break
  }

  if (violated) {
    return {
      type: "perSubjectPlacement",
      severity: psc.level === "forbidden" ? "error" : "warning",
      message,
      komaId,
      dayOfWeek: pos.dayOfWeek,
      period: pos.period,
      weight: psc.level === "forbidden" ? HARD_COST : 60,
    }
  }
  return null
}

function checkPerSubjectMaxPerDay(
  ctx: ConstraintContext,
  komaId: string,
  pos: SlotPosition
): Violation | null {
  if (ctx.perSubjectConditions.length === 0) return null
  const koma = ctx.komaLookup[komaId]
  if (!koma) return null

  const psc = ctx.perSubjectConditions.find(
    (c) => c.subjectId === koma.subjectId
  )
  if (!psc) return null
  if (psc.level === "ignore") return null

  // 同一クラス×同一教科×同一曜日の配置数をカウント
  for (const cid of koma.classIds) {
    const dayMap = ctx.classMap[cid]?.[pos.dayOfWeek]
    if (!dayMap) continue
    let count = 1 // +1 for the koma being placed
    for (const existingKomaId of Object.values(dayMap)) {
      if (!existingKomaId || existingKomaId === komaId) continue
      const existingKoma = ctx.komaLookup[existingKomaId]
      if (existingKoma && existingKoma.subjectId === koma.subjectId) {
        count++
      }
    }
    if (count > psc.maxPerDay) {
      return {
        type: "perSubjectMaxPerDay",
        severity: psc.level === "forbidden" ? "error" : "warning",
        message: `教科の1日最大コマ数(${psc.maxPerDay})を超過`,
        komaId,
        classId: cid,
        dayOfWeek: pos.dayOfWeek,
        period: pos.period,
        weight: psc.level === "forbidden" ? HARD_COST : 60,
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
    checkPerSubjectPlacement(ctx, komaId, pos),
    checkPerSubjectMaxPerDay(ctx, komaId, pos),
    checkDailyBalance(ctx, komaId, pos),
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
    if (existing) return false
  }

  // Class conflict (always hard)
  for (const cid of koma.classIds) {
    const existing = ctx.classMap[cid]?.[pos.dayOfWeek]?.[pos.period]
    if (existing) return false
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
      if (existing) return false
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

  // Class same subject per day (if forbidden, 教科別条件が設定済みの教科はスキップ)
  if (isForbidden(ctx.condition.classSameSubjectPerDay) &&
      !ctx.perSubjectConditions.some((c) => c.subjectId === koma.subjectId)) {
    for (const cid of koma.classIds) {
      const dayMap = ctx.classMap[cid]?.[pos.dayOfWeek]
      if (!dayMap) continue
      for (const existingKomaId of Object.values(dayMap)) {
        if (!existingKomaId || existingKomaId === komaId) continue
        const existingKoma = ctx.komaLookup[existingKomaId]
        if (existingKoma && existingKoma.subjectId === koma.subjectId) return false
      }
    }
  }

  // Per-subject constraints (if forbidden)
  if (ctx.perSubjectConditions.length > 0) {
    const psc = ctx.perSubjectConditions.find(
      (c) => c.subjectId === koma.subjectId
    )
    if (psc && psc.level === "forbidden") {
      // Placement restriction
      if (psc.placementRestriction !== "any") {
        const period = pos.period
        const isMorning = period <= ctx.lunchAfterPeriod
        let violated = false
        switch (psc.placementRestriction) {
          case "morning_only": violated = !isMorning; break
          case "afternoon_only": violated = isMorning; break
          case "not_first": violated = period === 1; break
          case "not_last": violated = period === ctx.maxPeriodsPerDay; break
        }
        if (violated) return false
      }
      // Max per day
      for (const cid of koma.classIds) {
        const dayMap = ctx.classMap[cid]?.[pos.dayOfWeek]
        if (!dayMap) continue
        let count = 1
        for (const existingKomaId of Object.values(dayMap)) {
          if (!existingKomaId || existingKomaId === komaId) continue
          const existingKoma = ctx.komaLookup[existingKomaId]
          if (existingKoma && existingKoma.subjectId === koma.subjectId) count++
        }
        if (count > psc.maxPerDay) return false
      }
    }
  }

  return true
}

export function evaluateAllConstraints(
  ctx: ConstraintContext,
  assignments: Assignment[]
): Violation[] {
  // 割り当てからスケジュールマップを再構築して正確に評価
  const { teacherMap, classMap, roomMap } = buildScheduleMaps(assignments, ctx.komaLookup)
  const evalCtx: ConstraintContext = { ...ctx, teacherMap, classMap, roomMap }

  const violations: Violation[] = []

  // ── 未配置チェック: コマごとの必要数と実配置数を比較 ──
  const placedCount = new Map<string, number>()
  for (const a of assignments) {
    placedCount.set(a.komaId, (placedCount.get(a.komaId) ?? 0) + 1)
  }
  for (const [komaId, koma] of Object.entries(evalCtx.komaLookup)) {
    const placed = placedCount.get(komaId) ?? 0
    const missing = koma.count - placed
    if (missing > 0) {
      violations.push({
        type: "unplaced",
        severity: "error",
        message: `未配置: ${koma.label ?? komaId} が${missing}コマ不足`,
        komaId,
        weight: HARD_COST,
      })
    }
  }

  for (const a of assignments) {
    // 配置済みマップから一時除去 → checkPlacement の +1 ロジックが正しく機能
    removeFromScheduleMaps(evalCtx, a.komaId, a)
    const vs = checkPlacement(evalCtx, a.komaId, a, assignments)
    violations.push(...vs)
    addToScheduleMaps(evalCtx, a.komaId, a)
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

function removeFromScheduleMaps(
  ctx: ConstraintContext,
  komaId: string,
  pos: SlotPosition
): void {
  const koma = ctx.komaLookup[komaId]
  if (!koma) return
  for (const tid of koma.teacherIds) {
    if (ctx.teacherMap[tid]?.[pos.dayOfWeek]?.[pos.period] === komaId) {
      delete ctx.teacherMap[tid][pos.dayOfWeek][pos.period]
    }
  }
  for (const cid of koma.classIds) {
    if (ctx.classMap[cid]?.[pos.dayOfWeek]?.[pos.period] === komaId) {
      delete ctx.classMap[cid][pos.dayOfWeek][pos.period]
    }
  }
  for (const rid of koma.roomIds) {
    if (ctx.roomMap[rid]?.[pos.dayOfWeek]?.[pos.period] === komaId) {
      delete ctx.roomMap[rid][pos.dayOfWeek][pos.period]
    }
  }
}

function addToScheduleMaps(
  ctx: ConstraintContext,
  komaId: string,
  pos: SlotPosition
): void {
  const koma = ctx.komaLookup[komaId]
  if (!koma) return
  for (const tid of koma.teacherIds) {
    if (!ctx.teacherMap[tid]) ctx.teacherMap[tid] = {}
    if (!ctx.teacherMap[tid][pos.dayOfWeek]) ctx.teacherMap[tid][pos.dayOfWeek] = {}
    ctx.teacherMap[tid][pos.dayOfWeek][pos.period] = komaId
  }
  for (const cid of koma.classIds) {
    if (!ctx.classMap[cid]) ctx.classMap[cid] = {}
    if (!ctx.classMap[cid][pos.dayOfWeek]) ctx.classMap[cid][pos.dayOfWeek] = {}
    ctx.classMap[cid][pos.dayOfWeek][pos.period] = komaId
  }
  for (const rid of koma.roomIds) {
    if (!ctx.roomMap[rid]) ctx.roomMap[rid] = {}
    if (!ctx.roomMap[rid][pos.dayOfWeek]) ctx.roomMap[rid][pos.dayOfWeek] = {}
    ctx.roomMap[rid][pos.dayOfWeek][pos.period] = komaId
  }
}

export function calculateScore(violations: Violation[]): number {
  return violations.reduce((sum, v) => sum + v.weight, 0)
}

/**
 * 単一コマの配置コストを高速計算（貪欲構築＋タブー探索用）。
 * ハード制約違反は HARD_COST=100000、ソフト制約は設定重みを返す。
 *
 * 重要: 呼び出し元はこのコマをマップから除去してから呼ぶこと。
 * これにより +1 カウントと自己占有チェックが正しく機能する。
 */
export function computeKomaPlacementCost(
  ctx: ConstraintContext,
  komaId: string,
  pos: SlotPosition
): number {
  const koma = ctx.komaLookup[komaId]
  if (!koma) return 0

  let cost = 0

  // Self-occupation: 同一コマの別インスタンスが同一スロットにある場合
  for (const cid of koma.classIds) {
    const existing = ctx.classMap[cid]?.[pos.dayOfWeek]?.[pos.period]
    if (existing === komaId) {
      cost += HARD_COST
      break
    }
  }

  // Teacher conflict (hard)
  for (const tid of koma.teacherIds) {
    const existing = ctx.teacherMap[tid]?.[pos.dayOfWeek]?.[pos.period]
    if (existing && existing !== komaId) {
      cost += HARD_COST
      break
    }
  }

  // Class conflict (hard)
  for (const cid of koma.classIds) {
    const existing = ctx.classMap[cid]?.[pos.dayOfWeek]?.[pos.period]
    if (existing && existing !== komaId) {
      cost += HARD_COST
      break
    }
  }

  // Teacher availability
  if (isActive(ctx.condition.teacherAvailability)) {
    for (const tid of koma.teacherIds) {
      const status = ctx.teacherAvailMap[tid]?.[pos.dayOfWeek]?.[pos.period]
      if (status === "unavailable") {
        cost += isForbidden(ctx.condition.teacherAvailability)
          ? HARD_COST
          : ctx.condition.teacherAvailabilityWeight
        break
      }
    }
  }

  // Teacher max per day
  if (isActive(ctx.condition.teacherMaxPerDay)) {
    for (const tid of koma.teacherIds) {
      const daySlots = getTeacherDaySlots(ctx.teacherMap, tid, pos.dayOfWeek)
      const teacherData = findTeacher(ctx, tid)
      if (teacherData && daySlots.length + 1 > teacherData.maxPerDay) {
        cost += isForbidden(ctx.condition.teacherMaxPerDay)
          ? HARD_COST
          : ctx.condition.teacherMaxPerDayWeight
        break
      }
    }
  }

  // Teacher max consecutive
  if (isActive(ctx.condition.teacherMaxConsecutive)) {
    for (const tid of koma.teacherIds) {
      const daySlots = getTeacherDaySlots(ctx.teacherMap, tid, pos.dayOfWeek)
      const allSlots = [...daySlots, pos.period].sort((a, b) => a - b)
      let maxConsec = 1, cur = 1
      for (let i = 1; i < allSlots.length; i++) {
        if (allSlots[i] === allSlots[i - 1] + 1) { cur++; maxConsec = Math.max(maxConsec, cur) }
        else cur = 1
      }
      const teacherData = findTeacher(ctx, tid)
      if (teacherData && maxConsec > teacherData.maxConsecutive) {
        cost += isForbidden(ctx.condition.teacherMaxConsecutive)
          ? HARD_COST
          : ctx.condition.teacherMaxConsecutiveWeight
        break
      }
    }
  }

  // Teacher max per week
  if (isActive(ctx.condition.teacherMaxPerWeek)) {
    for (const tid of koma.teacherIds) {
      const weekCount = countTeacherWeekSlots(ctx.teacherMap, tid)
      const teacherData = findTeacher(ctx, tid)
      if (teacherData && weekCount + 1 > teacherData.maxPeriodsPerWeek) {
        cost += isForbidden(ctx.condition.teacherMaxPerWeek)
          ? HARD_COST
          : ctx.condition.teacherMaxPerWeekWeight
        break
      }
    }
  }

  // Class same subject per day（教科別条件が設定済みの教科はスキップ）
  if (isActive(ctx.condition.classSameSubjectPerDay) &&
      !ctx.perSubjectConditions.some((c) => c.subjectId === koma.subjectId)) {
    for (const cid of koma.classIds) {
      const dayMap = ctx.classMap[cid]?.[pos.dayOfWeek]
      if (!dayMap) continue
      let found = false
      for (const existingKomaId of Object.values(dayMap)) {
        if (!existingKomaId || existingKomaId === komaId) continue
        const existingKoma = ctx.komaLookup[existingKomaId]
        if (existingKoma && existingKoma.subjectId === koma.subjectId) {
          cost += isForbidden(ctx.condition.classSameSubjectPerDay)
            ? HARD_COST
            : ctx.condition.classSameSubjectPerDayWeight
          found = true
          break
        }
      }
      if (found) break
    }
  }

  // Class consecutive same (non-consecutive type)
  if (isActive(ctx.condition.classConsecutiveSame)) {
    for (const cid of koma.classIds) {
      const dayMap = ctx.classMap[cid]?.[pos.dayOfWeek]
      if (!dayMap) continue
      let found = false
      for (const adj of [pos.period - 1, pos.period + 1]) {
        const adjKomaId = dayMap[adj]
        if (adjKomaId && adjKomaId !== komaId) {
          const adjKoma = ctx.komaLookup[adjKomaId]
          if (adjKoma && adjKoma.subjectId === koma.subjectId) {
            if (koma.type === "consecutive" || adjKoma.type === "consecutive") continue
            cost += isForbidden(ctx.condition.classConsecutiveSame)
              ? HARD_COST
              : ctx.condition.classConsecutiveSameWeight
            found = true
            break
          }
        }
      }
      if (found) break
    }
  }

  // Room conflict
  if (isActive(ctx.condition.roomConflict)) {
    for (const rid of koma.roomIds) {
      const existing = ctx.roomMap[rid]?.[pos.dayOfWeek]?.[pos.period]
      if (existing && existing !== komaId) {
        cost += isForbidden(ctx.condition.roomConflict)
          ? HARD_COST
          : ctx.condition.roomConflictWeight
        break
      }
    }
  }

  // Room availability
  if (isActive(ctx.condition.roomAvailability)) {
    for (const rid of koma.roomIds) {
      const status = ctx.roomAvailMap[rid]?.[pos.dayOfWeek]?.[pos.period]
      if (status === "unavailable") {
        cost += isForbidden(ctx.condition.roomAvailability)
          ? HARD_COST
          : ctx.condition.roomAvailabilityWeight
        break
      }
    }
  }

  // Duty conflict
  if (isActive(ctx.condition.dutyConflict)) {
    for (const tid of koma.teacherIds) {
      if (ctx.dutyMap[tid]?.[pos.dayOfWeek]?.has(pos.period)) {
        cost += isForbidden(ctx.condition.dutyConflict)
          ? HARD_COST
          : ctx.condition.dutyConflictWeight
        break
      }
    }
  }

  // Per-subject placement restriction
  if (ctx.perSubjectConditions.length > 0) {
    const psc = ctx.perSubjectConditions.find(
      (c) => c.subjectId === koma.subjectId
    )
    if (psc && psc.level !== "ignore") {
      if (psc.placementRestriction !== "any") {
        const period = pos.period
        const isMorning = period <= ctx.lunchAfterPeriod
        let violated = false
        switch (psc.placementRestriction) {
          case "morning_only":
            violated = !isMorning
            break
          case "afternoon_only":
            violated = isMorning
            break
          case "not_first":
            violated = period === 1
            break
          case "not_last":
            violated = period === ctx.maxPeriodsPerDay
            break
        }
        if (violated) cost += psc.level === "forbidden" ? HARD_COST : 60
      }

      // Per-subject max per day
      for (const cid of koma.classIds) {
        const dayMap = ctx.classMap[cid]?.[pos.dayOfWeek]
        if (!dayMap) continue
        let count = 1
        for (const existingKomaId of Object.values(dayMap)) {
          if (!existingKomaId || existingKomaId === komaId) continue
          const existingKoma = ctx.komaLookup[existingKomaId]
          if (existingKoma && existingKoma.subjectId === koma.subjectId) {
            count++
          }
        }
        if (count > psc.maxPerDay) {
          cost += psc.level === "forbidden" ? HARD_COST : 60
          break
        }
      }
    }
  }

  // Daily balance
  if (isActive(ctx.condition.dailyBalance)) {
    for (const tid of koma.teacherIds) {
      const days = ctx.teacherMap[tid]
      if (!days) continue
      const dayCounts: number[] = []
      for (let d = 0; d < 6; d++) {
        const dayMap = days[d]
        if (!dayMap) { dayCounts.push(0); continue }
        dayCounts.push(Object.values(dayMap).filter((v) => v != null).length)
      }
      dayCounts[pos.dayOfWeek] = (dayCounts[pos.dayOfWeek] ?? 0) + 1
      const activeDays = dayCounts.filter((c) => c > 0)
      if (activeDays.length >= 2) {
        const max = Math.max(...activeDays)
        const min = Math.min(...activeDays)
        if (max - min >= 2) {
          cost += isForbidden(ctx.condition.dailyBalance)
            ? HARD_COST
            : ctx.condition.dailyBalanceWeight
          break
        }
      }
    }
  }

  // Consecutive koma（連続駒の隣接チェック）
  if (isActive(ctx.condition.consecutiveKoma) && koma.type === "consecutive") {
    for (const cid of koma.classIds) {
      const dayMap = ctx.classMap[cid]?.[pos.dayOfWeek]
      if (!dayMap) continue
      const sameKomaPeriods: number[] = []
      for (const [p, kid] of Object.entries(dayMap)) {
        if (kid === komaId) sameKomaPeriods.push(Number(p))
      }
      if (sameKomaPeriods.length > 0) {
        const isAdjacent = sameKomaPeriods.some(
          (p) => Math.abs(p - pos.period) === 1
        )
        if (!isAdjacent) {
          cost += isForbidden(ctx.condition.consecutiveKoma)
            ? HARD_COST
            : ctx.condition.consecutiveKomaWeight
        }
      }
      break
    }
  }

  return cost
}

/**
 * SA 用の高速スコア計算。Violation オブジェクトを生成せず、重みだけを加算する。
 * ctx のスケジュールマップは呼び出し元が正しく設定済みであること。
 */
export function calculateScoreFast(
  ctx: ConstraintContext,
  assignments: Assignment[]
): number {
  let score = 0

  for (const a of assignments) {
    const pos: SlotPosition = { dayOfWeek: a.dayOfWeek, period: a.period }
    // 一時除去 → computeKomaPlacementCost（+1設計）で正しく評価 → 復元
    removeFromScheduleMaps(ctx, a.komaId, pos)
    score += computeKomaPlacementCost(ctx, a.komaId, pos)
    addToScheduleMaps(ctx, a.komaId, pos)
  }

  return score
}
