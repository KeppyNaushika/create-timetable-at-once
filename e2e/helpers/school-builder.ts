/**
 * E2Eテスト共通データビルダー
 *
 * IPC経由でテストデータを作成するヘルパー関数群。
 * full-school-demo.spec.ts と同じパターンを共通化。
 */
import type { Page } from "@playwright/test"

import { TEST_BASE_URL } from "./electron-app"

// ── 型定義 ──────────────────────────────────────

export interface SchoolConfig {
  name?: string
  academicYear?: number
  daysPerWeek?: number
  maxPeriodsPerDay?: number
  hasZeroPeriod?: boolean
  namingConvention?: string
  lunchAfterPeriod?: number
  gradeClassCounts: Record<number, number> // gradeNum → classCount
}

export interface SchoolIds {
  gradeIds: string[] // index = gradeNum - 1
  classIds: string[][] // classIds[gradeIdx][classIdx]
  subjectMap: Record<string, string> // subjectName → id
}

export interface TeacherDef {
  name: string
  mainSubject: string
  maxPeriodsPerWeek?: number
  maxPerDay?: number
  maxConsecutive?: number
}

export interface RoomDef {
  name: string
  shortName: string
  capacity?: number
}

export interface DutyDef {
  name: string
  dayOfWeek: number
  period: number
  teacherIndices: number[] // index into teacherIds array
}

export interface KomaDef {
  subjectName: string
  gradeNum: number
  classIndices: number[]
  teacherIndices: number[]
  roomIndices?: number[] // index into roomIds array
  count: number
  type?: string
  priority?: number
}

export interface AvailabilityDef {
  teacherIndex: number
  dayOfWeek: number
  period: number
  status: "unavailable" | "preferred"
}

export interface RoomAvailabilityDef {
  roomIndex: number
  dayOfWeek: number
  period: number
  status: "unavailable"
}

export interface ConditionOverrides {
  teacherAvailability?: string
  teacherAvailabilityWeight?: number
  teacherMaxPerDay?: string
  teacherMaxPerDayWeight?: number
  teacherMaxConsecutive?: string
  teacherMaxConsecutiveWeight?: number
  teacherMaxPerWeek?: string
  teacherMaxPerWeekWeight?: number
  classSameSubjectPerDay?: string
  classSameSubjectPerDayWeight?: number
  classConsecutiveSame?: string
  classConsecutiveSameWeight?: number
  roomConflict?: string
  roomConflictWeight?: number
  roomAvailability?: string
  roomAvailabilityWeight?: number
  dutyConflict?: string
  dutyConflictWeight?: number
  consecutiveKoma?: string
  consecutiveKomaWeight?: number
  dailyBalance?: string
  dailyBalanceWeight?: number
}

export interface PerSubjectConditionDef {
  subjectName: string
  level?: string
  placementRestriction?: string
  maxPerDay?: number
}

export interface SolverUIResult {
  patternId: string
  slotCount: number
}

// ── デフォルト制約条件 ─────────────────────────────

const DEFAULT_CONDITION: ConditionOverrides = {
  teacherAvailability: "forbidden",
  teacherAvailabilityWeight: 100,
  teacherMaxPerDay: "consider",
  teacherMaxPerDayWeight: 80,
  teacherMaxConsecutive: "consider",
  teacherMaxConsecutiveWeight: 80,
  teacherMaxPerWeek: "consider",
  teacherMaxPerWeekWeight: 60,
  classSameSubjectPerDay: "consider",
  classSameSubjectPerDayWeight: 70,
  classConsecutiveSame: "ignore",
  classConsecutiveSameWeight: 50,
  roomConflict: "forbidden",
  roomConflictWeight: 100,
  roomAvailability: "forbidden",
  roomAvailabilityWeight: 100,
  dutyConflict: "forbidden",
  dutyConflictWeight: 100,
  consecutiveKoma: "consider",
  consecutiveKomaWeight: 90,
  dailyBalance: "consider",
  dailyBalanceWeight: 40,
}

// ── ビルダー関数 ────────────────────────────────────

/**
 * 学校基本情報 + 学年・クラスを作成
 */
export async function createTestSchool(
  page: Page,
  config: SchoolConfig
): Promise<SchoolIds> {
  const gradeNums = Object.keys(config.gradeClassCounts)
    .map(Number)
    .sort((a, b) => a - b)

  const periodNames = Array.from(
    { length: config.maxPeriodsPerDay ?? 6 },
    (_, i) => `${i + 1}限`
  )
  const periodLengths = Array.from(
    { length: config.maxPeriodsPerDay ?? 6 },
    () => 50
  )

  await page.evaluate(
    async (data) => {
      await window.electronAPI.schoolCreate(data)
    },
    {
      name: config.name ?? "テスト中学校",
      academicYear: config.academicYear ?? 2026,
      daysPerWeek: config.daysPerWeek ?? 5,
      maxPeriodsPerDay: config.maxPeriodsPerDay ?? 6,
      hasZeroPeriod: config.hasZeroPeriod ?? false,
      namingConvention: config.namingConvention ?? "number",
      periodNamesJson: JSON.stringify(periodNames),
      periodLengthsJson: JSON.stringify(periodLengths),
      lunchAfterPeriod: config.lunchAfterPeriod ?? 4,
      classCountsJson: JSON.stringify(
        Object.fromEntries(
          gradeNums.map((g) => [String(g), config.gradeClassCounts[g]])
        )
      ),
    }
  )

  const gradeIds: string[] = []
  const classIds: string[][] = []

  for (const gradeNum of gradeNums) {
    const grade = await page.evaluate(
      async (args) => window.electronAPI.gradeCreate(args),
      { gradeNum, name: `${gradeNum}年` }
    )
    gradeIds.push(grade.id)

    const classCount = config.gradeClassCounts[gradeNum]
    const classInputs = Array.from({ length: classCount }, (_, i) => ({
      gradeId: grade.id,
      name: `${i + 1}組`,
      sortOrder: i + 1,
    }))
    const classes = await page.evaluate(
      async (args) => window.electronAPI.classBatchCreate(args),
      classInputs
    )
    classIds.push(classes.map((c) => c.id))
  }

  return { gradeIds, classIds, subjectMap: {} }
}

/**
 * デフォルト教科をシード登録し、subjectMap を返す
 */
export async function createTestSubjects(
  page: Page
): Promise<Record<string, string>> {
  await page.evaluate(async () => {
    await window.electronAPI.subjectSeedDefaults()
  })
  const subjects = await page.evaluate(() =>
    window.electronAPI.subjectGetAll()
  )
  const subjectMap: Record<string, string> = {}
  for (const s of subjects) {
    subjectMap[s.name] = s.id
  }
  return subjectMap
}

/**
 * 教員を一括登録
 */
export async function createTestTeachers(
  page: Page,
  teachers: TeacherDef[],
  subjectMap: Record<string, string>
): Promise<string[]> {
  const teacherData = teachers.map((t) => ({
    name: t.name,
    nameKana: "",
    mainSubjectId: subjectMap[t.mainSubject] ?? null,
    maxPeriodsPerWeek: t.maxPeriodsPerWeek ?? 25,
    maxPerDay: t.maxPerDay ?? 6,
    maxConsecutive: t.maxConsecutive ?? 4,
  }))

  const created = await page.evaluate(
    async (data) => window.electronAPI.teacherBatchImport(data),
    teacherData
  )
  return created.map((t) => t.id)
}

/**
 * 教員の空き時間を一括設定
 */
export async function setTeacherAvailabilities(
  page: Page,
  teacherIds: string[],
  availabilities: AvailabilityDef[]
): Promise<void> {
  const items = availabilities.map((a) => ({
    teacherId: teacherIds[a.teacherIndex],
    dayOfWeek: a.dayOfWeek,
    period: a.period,
    status: a.status,
  }))
  await page.evaluate(
    async (data) =>
      window.electronAPI.teacherAvailabilityBatchUpsert(data),
    items
  )
}

/**
 * 特別教室を作成
 */
export async function createTestRooms(
  page: Page,
  rooms: RoomDef[]
): Promise<string[]> {
  const ids: string[] = []
  for (const rd of rooms) {
    const room = await page.evaluate(
      async (data) => window.electronAPI.roomCreate(data),
      { name: rd.name, shortName: rd.shortName, capacity: rd.capacity ?? 40 }
    )
    ids.push(room.id)
  }
  return ids
}

/**
 * 教室の空き時間を一括設定
 */
export async function setRoomAvailabilities(
  page: Page,
  roomIds: string[],
  availabilities: RoomAvailabilityDef[]
): Promise<void> {
  const items = availabilities.map((a) => ({
    roomId: roomIds[a.roomIndex],
    dayOfWeek: a.dayOfWeek,
    period: a.period,
    status: a.status,
  }))
  await page.evaluate(
    async (data) =>
      window.electronAPI.roomAvailabilityBatchUpsert(data),
    items
  )
}

/**
 * 校務を作成し教員を割当
 */
export async function createTestDuties(
  page: Page,
  duties: DutyDef[],
  teacherIds: string[]
): Promise<string[]> {
  const ids: string[] = []
  for (const d of duties) {
    const duty = await page.evaluate(
      async (data) => window.electronAPI.dutyCreate(data),
      { name: d.name, dayOfWeek: d.dayOfWeek, period: d.period }
    )
    ids.push(duty.id)

    const tIds = d.teacherIndices.map((i) => teacherIds[i])
    await page.evaluate(
      async (args) =>
        window.electronAPI.dutySetTeachers(args.dutyId, args.teacherIds),
      { dutyId: duty.id, teacherIds: tIds }
    )
  }
  return ids
}

/**
 * 駒を一括作成（教員・クラス・教室の紐付け含む）
 */
export async function createTestKomas(
  page: Page,
  komas: KomaDef[],
  schoolIds: SchoolIds,
  teacherIds: string[],
  roomIds: string[]
): Promise<string[]> {
  const komaIds: string[] = []
  for (const k of komas) {
    const gradeIdx = k.gradeNum - 1
    const gradeId = schoolIds.gradeIds[gradeIdx]
    const subjectId = schoolIds.subjectMap[k.subjectName]

    const koma = await page.evaluate(
      async (data) => window.electronAPI.komaCreate(data),
      {
        subjectId,
        gradeId,
        type: k.type ?? "normal",
        count: k.count,
        priority: k.priority ?? 5,
        label: "",
      }
    )
    komaIds.push(koma.id)

    // 教員紐付け
    const teachers = k.teacherIndices.map((i) => ({
      teacherId: teacherIds[i],
      role: "main",
    }))
    await page.evaluate(
      async (args) =>
        window.electronAPI.komaSetTeachers(args.komaId, args.teachers),
      { komaId: koma.id, teachers }
    )

    // クラス紐付け
    const classIdList = k.classIndices.map(
      (ci) => schoolIds.classIds[gradeIdx][ci]
    )
    await page.evaluate(
      async (args) =>
        window.electronAPI.komaSetClasses(args.komaId, args.classIds),
      { komaId: koma.id, classIds: classIdList }
    )

    // 教室紐付け
    if (k.roomIndices && k.roomIndices.length > 0) {
      const rIds = k.roomIndices.map((i) => roomIds[i])
      await page.evaluate(
        async (args) =>
          window.electronAPI.komaSetRooms(args.komaId, args.roomIds),
        { komaId: koma.id, roomIds: rIds }
      )
    }
  }
  return komaIds
}

/**
 * 制約条件を作成
 */
export async function createTestCondition(
  page: Page,
  overrides?: ConditionOverrides
): Promise<string> {
  const data = { ...DEFAULT_CONDITION, ...overrides }
  const condition = await page.evaluate(
    async (d) => window.electronAPI.conditionUpsert(d),
    data
  )
  return condition.id
}

/**
 * 教科別条件を設定
 */
export async function createPerSubjectConditions(
  page: Page,
  conditionId: string,
  configs: PerSubjectConditionDef[],
  subjectMap: Record<string, string>
): Promise<void> {
  for (const c of configs) {
    const subjectId = subjectMap[c.subjectName]
    if (!subjectId) continue
    await page.evaluate(
      async (args) =>
        window.electronAPI.conditionUpsertPerSubject(args),
      {
        conditionId,
        subjectId,
        level: c.level,
        placementRestriction: c.placementRestriction,
        maxPerDay: c.maxPerDay,
      }
    )
  }
}

/**
 * UI経由でソルバーを実行し、結果を保存する
 */
export async function runSolverViaUI(
  page: Page,
  timeoutMs = 120_000
): Promise<SolverUIResult> {
  await page.goto(`${TEST_BASE_URL}/scheduler/auto`)
  await page.waitForLoadState("networkidle")

  // 自動作成開始
  await page.getByRole("button", { name: "自動作成開始" }).click()

  // 中断ボタンの表示確認（ソルバー稼働中）
  await page.getByRole("button", { name: "中断" }).waitFor({
    state: "visible",
    timeout: 5000,
  })

  // 完了待機
  await page
    .getByRole("button", { name: "結果を保存" })
    .waitFor({ state: "visible", timeout: timeoutMs })

  // 結果を保存
  await page.getByRole("button", { name: "結果を保存" }).click()
  await page.waitForTimeout(3000)

  // パターン取得
  const patterns = await page.evaluate(() =>
    window.electronAPI.patternGetAll()
  )
  const patternId = patterns[patterns.length - 1].id

  const patternWithSlots = await page.evaluate(
    async (id) => window.electronAPI.patternGetWithSlots(id),
    patternId
  )
  const slotCount = patternWithSlots?.slots?.length ?? 0

  return { patternId, slotCount }
}

/**
 * 教員の重複配置がないか検証
 */
export function validateNoTeacherConflicts(
  slots: { komaId: string; dayOfWeek: number; period: number }[],
  komaData: {
    id: string
    komaTeachers?: { teacherId: string }[]
  }[]
): { valid: boolean; conflicts: string[] } {
  const komaMap = new Map(komaData.map((k) => [k.id, k]))
  const schedule = new Map<string, Set<string>>()
  const conflicts: string[] = []

  for (const slot of slots) {
    const koma = komaMap.get(slot.komaId)
    if (!koma) continue
    for (const kt of koma.komaTeachers ?? []) {
      const tId = kt.teacherId
      if (!schedule.has(tId)) schedule.set(tId, new Set())
      const key = `${slot.dayOfWeek}-${slot.period}`
      if (schedule.get(tId)!.has(key)) {
        conflicts.push(
          `Teacher ${tId} conflict at day=${slot.dayOfWeek} period=${slot.period}`
        )
      }
      schedule.get(tId)!.add(key)
    }
  }

  return { valid: conflicts.length === 0, conflicts }
}

/**
 * クラスの重複配置がないか検証
 */
export function validateNoClassConflicts(
  slots: { komaId: string; dayOfWeek: number; period: number }[],
  komaData: {
    id: string
    komaClasses?: { classId: string }[]
  }[]
): { valid: boolean; conflicts: string[] } {
  const komaMap = new Map(komaData.map((k) => [k.id, k]))
  const schedule = new Map<string, Set<string>>()
  const conflicts: string[] = []

  for (const slot of slots) {
    const koma = komaMap.get(slot.komaId)
    if (!koma) continue
    for (const kc of koma.komaClasses ?? []) {
      const cId = kc.classId
      if (!schedule.has(cId)) schedule.set(cId, new Set())
      const key = `${slot.dayOfWeek}-${slot.period}`
      if (schedule.get(cId)!.has(key)) {
        conflicts.push(
          `Class ${cId} conflict at day=${slot.dayOfWeek} period=${slot.period}`
        )
      }
      schedule.get(cId)!.add(key)
    }
  }

  return { valid: conflicts.length === 0, conflicts }
}
