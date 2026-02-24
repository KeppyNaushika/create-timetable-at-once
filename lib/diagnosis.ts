import type { ConstraintContext } from "@/lib/solver/constraints"
import {
  calculateScore,
  evaluateAllConstraints,
  setTeacherCache,
} from "@/lib/solver/constraints"
import type { Assignment } from "@/lib/solver/types"
import {
  buildDutyMap,
  buildKomaLookup,
  buildRoomAvailabilityMap,
  buildScheduleMaps,
  buildTeacherAvailabilityMap,
} from "@/lib/solver/utils"
import type {
  ClassInfo,
  Duty,
  Koma,
  ScheduleCondition,
  School,
  SpecialRoom,
  Subject,
  Teacher,
  TimetableSlot,
} from "@/types/common.types"
import type {
  CategoryDiagnosis,
  DiagnosisGrade,
  DiagnosisResult,
} from "@/types/review.types"

interface DiagnosisInput {
  school: School
  teachers: Teacher[]
  classes: ClassInfo[]
  subjects: Subject[]
  rooms: SpecialRoom[]
  duties: Duty[]
  komas: Koma[]
  slots: TimetableSlot[]
  condition: ScheduleCondition
}

function scoreToGrade(score: number): DiagnosisGrade {
  if (score >= 90) return "A"
  if (score >= 75) return "B"
  if (score >= 60) return "C"
  if (score >= 40) return "D"
  return "E"
}

function diagnoseConstraintViolations(
  ctx: ConstraintContext,
  assignments: Assignment[]
): CategoryDiagnosis {
  const violations = evaluateAllConstraints(ctx, assignments)
  const totalScore = calculateScore(violations)
  const errorCount = violations.filter((v) => v.severity === "error").length
  const warningCount = violations.filter((v) => v.severity === "warning").length

  // スコア計算: 違反なし=100, 違反が多いほど減点
  let score = 100
  score -= errorCount * 15
  score -= warningCount * 5
  score -= Math.floor(totalScore / 10)
  score = Math.max(0, Math.min(100, score))

  const details: string[] = []
  if (errorCount > 0) details.push(`重大な違反: ${errorCount}件`)
  if (warningCount > 0) details.push(`軽微な違反: ${warningCount}件`)
  if (violations.length === 0) details.push("制約違反はありません")

  // 違反タイプ別集計
  const typeCount = new Map<string, number>()
  for (const v of violations) {
    typeCount.set(v.type, (typeCount.get(v.type) ?? 0) + 1)
  }
  for (const [type, count] of typeCount) {
    details.push(`${type}: ${count}件`)
  }

  const suggestions: string[] = []
  if (errorCount > 0)
    suggestions.push("重大な制約違反を解消するため、手動配置の見直しを推奨")
  if (warningCount > 5)
    suggestions.push("警告が多いため、処理条件の見直しを検討してください")

  return {
    category: "constraintViolation",
    label: "制約違反",
    grade: scoreToGrade(score),
    score,
    details,
    suggestions,
  }
}

function diagnoseTeacherLoadBalance(
  teachers: Teacher[],
  slots: TimetableSlot[],
  komas: Koma[],
  daysPerWeek: number
): CategoryDiagnosis {
  const komaMap = new Map(komas.map((k) => [k.id, k]))

  // 先生ごとの曜日別授業数を計算
  const teacherDayLoad = new Map<string, Map<number, number>>()

  for (const slot of slots) {
    const koma = komaMap.get(slot.komaId)
    if (!koma) continue
    for (const kt of koma.komaTeachers ?? []) {
      if (!teacherDayLoad.has(kt.teacherId))
        teacherDayLoad.set(kt.teacherId, new Map())
      const dayMap = teacherDayLoad.get(kt.teacherId)!
      dayMap.set(slot.dayOfWeek, (dayMap.get(slot.dayOfWeek) ?? 0) + 1)
    }
  }

  // 各先生の曜日間分散を計算
  const variances: number[] = []
  const details: string[] = []
  let unevenCount = 0

  for (const teacher of teachers) {
    const dayMap = teacherDayLoad.get(teacher.id)
    if (!dayMap || dayMap.size === 0) continue

    const counts: number[] = []
    for (let d = 0; d < daysPerWeek; d++) {
      counts.push(dayMap.get(d) ?? 0)
    }

    const avg = counts.reduce((a, b) => a + b, 0) / daysPerWeek
    if (avg === 0) continue

    const variance =
      counts.reduce((sum, c) => sum + (c - avg) ** 2, 0) / daysPerWeek
    variances.push(variance)

    if (variance > 2) {
      unevenCount++
      details.push(
        `${teacher.name}: 曜日間のばらつきが大きい (${counts.join(",")})`
      )
    }
  }

  const avgVariance =
    variances.length > 0
      ? variances.reduce((a, b) => a + b, 0) / variances.length
      : 0

  let score = 100
  score -= Math.floor(avgVariance * 15)
  score -= unevenCount * 5
  score = Math.max(0, Math.min(100, score))

  if (unevenCount === 0 && variances.length > 0)
    details.unshift("全先生の負荷は均等です")

  const suggestions: string[] = []
  if (unevenCount > 0)
    suggestions.push(
      "負荷が偏っている先生の授業を別の曜日に移動することを検討してください"
    )

  return {
    category: "teacherLoadBalance",
    label: "先生負荷バランス",
    grade: scoreToGrade(score),
    score,
    details: details.slice(0, 10),
    suggestions,
  }
}

function diagnoseClassGaps(
  classes: ClassInfo[],
  slots: TimetableSlot[],
  komas: Koma[],
  daysPerWeek: number,
  _maxPeriodsPerDay: number
): CategoryDiagnosis {
  const komaMap = new Map(komas.map((k) => [k.id, k]))

  // クラスごとの曜日別の配置時限を取得
  const classDayPeriods = new Map<string, Map<number, Set<number>>>()

  for (const slot of slots) {
    const koma = komaMap.get(slot.komaId)
    if (!koma) continue
    for (const kc of koma.komaClasses ?? []) {
      if (!classDayPeriods.has(kc.classId))
        classDayPeriods.set(kc.classId, new Map())
      const dayMap = classDayPeriods.get(kc.classId)!
      if (!dayMap.has(slot.dayOfWeek)) dayMap.set(slot.dayOfWeek, new Set())
      dayMap.get(slot.dayOfWeek)!.add(slot.period)
    }
  }

  let totalGaps = 0
  const details: string[] = []

  for (const cls of classes) {
    const dayMap = classDayPeriods.get(cls.id)
    if (!dayMap) continue

    for (let d = 0; d < daysPerWeek; d++) {
      const periods = dayMap.get(d)
      if (!periods || periods.size < 2) continue

      const sorted = Array.from(periods).sort((a, b) => a - b)
      for (let i = 1; i < sorted.length; i++) {
        const gap = sorted[i] - sorted[i - 1] - 1
        if (gap > 0) {
          totalGaps += gap
        }
      }
    }
  }

  let score = 100
  score -= totalGaps * 10
  score = Math.max(0, Math.min(100, score))

  if (totalGaps === 0) details.push("空き時間（ギャップ）はありません")
  else details.push(`空き時間（ギャップ）: ${totalGaps}件`)

  const suggestions: string[] = []
  if (totalGaps > 0)
    suggestions.push(
      "クラスの空き時間を減らすため、授業を詰めて配置することを検討してください"
    )

  return {
    category: "classGapAnalysis",
    label: "クラス空き時間",
    grade: scoreToGrade(score),
    score,
    details,
    suggestions,
  }
}

function diagnoseRoomUtilization(
  rooms: SpecialRoom[],
  slots: TimetableSlot[],
  komas: Koma[],
  daysPerWeek: number,
  maxPeriodsPerDay: number
): CategoryDiagnosis {
  if (rooms.length === 0) {
    return {
      category: "roomUtilization",
      label: "教室稼働率",
      grade: "A",
      score: 100,
      details: ["特別教室は未設定です"],
      suggestions: [],
    }
  }

  const komaMap = new Map(komas.map((k) => [k.id, k]))
  const totalSlots = daysPerWeek * maxPeriodsPerDay

  const roomUsage = new Map<string, number>()
  for (const slot of slots) {
    const koma = komaMap.get(slot.komaId)
    if (!koma) continue
    for (const kr of koma.komaRooms ?? []) {
      roomUsage.set(kr.roomId, (roomUsage.get(kr.roomId) ?? 0) + 1)
    }
  }

  const details: string[] = []
  const rates: number[] = []

  for (const room of rooms) {
    const usage = roomUsage.get(room.id) ?? 0
    const rate = totalSlots > 0 ? Math.round((usage / totalSlots) * 100) : 0
    rates.push(rate)
    details.push(`${room.name}: ${rate}%（${usage}/${totalSlots}コマ）`)
  }

  const avgRate =
    rates.length > 0
      ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
      : 0

  // 稼働率が適度（30-80%）が理想
  let score = 100
  if (avgRate < 10) score -= 20
  if (avgRate > 90) score -= 15
  score = Math.max(0, Math.min(100, score))

  details.unshift(`平均稼働率: ${avgRate}%`)

  const suggestions: string[] = []
  if (avgRate > 80)
    suggestions.push("教室の稼働率が高すぎます。教室の追加を検討してください")
  if (avgRate < 10 && rooms.length > 0)
    suggestions.push("教室が十分に活用されていません")

  return {
    category: "roomUtilization",
    label: "教室稼働率",
    grade: scoreToGrade(score),
    score,
    details: details.slice(0, 10),
    suggestions,
  }
}

function diagnoseSubjectDistribution(
  classes: ClassInfo[],
  subjects: Subject[],
  slots: TimetableSlot[],
  komas: Koma[],
  _daysPerWeek: number
): CategoryDiagnosis {
  const komaMap = new Map(komas.map((k) => [k.id, k]))
  const subjectMap = new Map(subjects.map((s) => [s.id, s]))

  // クラス×教科ごとの曜日分散度を計算
  // classId -> subjectId -> Set<dayOfWeek>
  const distribution = new Map<string, Map<string, Set<number>>>()

  for (const slot of slots) {
    const koma = komaMap.get(slot.komaId)
    if (!koma) continue
    for (const kc of koma.komaClasses ?? []) {
      if (!distribution.has(kc.classId)) distribution.set(kc.classId, new Map())
      const subjMap = distribution.get(kc.classId)!
      if (!subjMap.has(koma.subjectId)) subjMap.set(koma.subjectId, new Set())
      subjMap.get(koma.subjectId)!.add(slot.dayOfWeek)
    }
  }

  let poorDistribCount = 0
  const details: string[] = []

  for (const cls of classes) {
    const subjMap = distribution.get(cls.id)
    if (!subjMap) continue

    for (const [subjectId, days] of subjMap) {
      const subject = subjectMap.get(subjectId)
      if (!subject) continue

      // 週2コマ以上ある教科の分散度をチェック
      // 同じ曜日に集中していたら低い
      const totalKomas = slots.filter((s) => {
        const k = komaMap.get(s.komaId)
        return (
          k &&
          k.subjectId === subjectId &&
          k.komaClasses?.some((kc) => kc.classId === cls.id)
        )
      }).length

      if (totalKomas >= 2 && days.size === 1) {
        poorDistribCount++
        details.push(
          `${cls.name}: ${subject.name}(${totalKomas}コマ)が1日に集中`
        )
      }
    }
  }

  let score = 100
  score -= poorDistribCount * 10
  score = Math.max(0, Math.min(100, score))

  if (poorDistribCount === 0 && distribution.size > 0)
    details.unshift("教科は曜日間で適切に分散されています")

  const suggestions: string[] = []
  if (poorDistribCount > 0)
    suggestions.push(
      "同一教科が特定の曜日に集中しています。別の曜日に分散させてください"
    )

  return {
    category: "subjectDistribution",
    label: "教科曜日分散",
    grade: scoreToGrade(score),
    score,
    details: details.slice(0, 10),
    suggestions,
  }
}

export function runDiagnosis(input: DiagnosisInput): DiagnosisResult {
  const {
    school,
    teachers,
    classes,
    subjects,
    rooms,
    duties,
    komas,
    slots,
    condition,
  } = input

  const daysPerWeek = school.daysPerWeek
  const maxPeriodsPerDay = school.maxPeriodsPerDay

  // 制約チェック用コンテキスト構築
  const komaLookup = buildKomaLookup(komas)
  const teacherAvailMap = buildTeacherAvailabilityMap(teachers)
  const roomAvailMap = buildRoomAvailabilityMap(rooms)
  const dutyMap = buildDutyMap(duties)

  const assignments: Assignment[] = slots.map((s) => ({
    komaId: s.komaId,
    dayOfWeek: s.dayOfWeek,
    period: s.period,
  }))

  const { teacherMap, classMap, roomMap, komaSlotCount } = buildScheduleMaps(
    assignments,
    komaLookup
  )

  setTeacherCache(teachers)

  const ctx: ConstraintContext = {
    condition,
    perSubjectConditions: condition.perSubjectConditions ?? [],
    komaLookup,
    teacherAvailMap,
    roomAvailMap,
    dutyMap,
    teacherMap,
    classMap,
    roomMap,
    komaSlotCount,
    maxPeriodsPerDay,
    lunchAfterPeriod: school.lunchAfterPeriod,
  }

  // 5カテゴリの診断実行
  const categories: CategoryDiagnosis[] = [
    diagnoseConstraintViolations(ctx, assignments),
    diagnoseTeacherLoadBalance(teachers, slots, komas, daysPerWeek),
    diagnoseClassGaps(classes, slots, komas, daysPerWeek, maxPeriodsPerDay),
    diagnoseRoomUtilization(rooms, slots, komas, daysPerWeek, maxPeriodsPerDay),
    diagnoseSubjectDistribution(classes, subjects, slots, komas, daysPerWeek),
  ]

  // 総合スコア = 各カテゴリの加重平均
  const weights = [30, 20, 20, 15, 15] // 制約違反に重み
  const overallScore = Math.round(
    categories.reduce((sum, c, i) => sum + c.score * weights[i], 0) /
      weights.reduce((a, b) => a + b, 0)
  )

  const totalViolations = evaluateAllConstraints(ctx, assignments).length

  return {
    overallGrade: scoreToGrade(overallScore),
    overallScore,
    categories,
    totalViolations,
    timestamp: new Date().toISOString(),
  }
}
