/**
 * 制約レベル forbidden/consider/ignore 検証テスト
 *
 * 構成: 1学年×2クラス、4教員、10駒(32スロット)
 * T0: 国語 → 月曜1-3限 unavailable
 * T1: 数学 → 火曜5限に校務(給食指導)
 * T2: 理科 → 理科室使用、金曜5-6限 教室unavailable
 * T3: 英語
 *
 * 3段階テスト:
 * 1. forbidden → 制約違反なし
 * 2. teacherAvailability を consider → 配置可能（warning扱い）
 * 3. teacherAvailability を ignore → ペナルティなし
 */
import { test } from "@playwright/test"
import type { Page } from "@playwright/test"

import {
  type AppContext,
  closeApp,
  expect,
  launchApp,
  TEST_BASE_URL,
} from "./helpers/fixtures"
import {
  createTestSchool,
  createTestSubjects,
  createTestTeachers,
  createTestRooms,
  createTestKomas,
  createTestDuties,
  createTestCondition,
  setTeacherAvailabilities,
  setRoomAvailabilities,
  runSolverViaUI,
  type SchoolIds,
} from "./helpers/school-builder"

test.describe.serial("制約レベル検証", () => {
  let ctx: AppContext
  let page: Page
  let schoolIds: SchoolIds
  let teacherIds: string[]
  let roomIds: string[]

  test.beforeAll(async () => {
    ctx = await launchApp()
    page = ctx.page
  })

  test.afterAll(async () => {
    await closeApp(ctx)
  })

  test("データセットアップ: 制約条件付きの小規模データ", async () => {
    test.setTimeout(60_000)

    schoolIds = await createTestSchool(page, {
      name: "制約テスト校",
      daysPerWeek: 5,
      maxPeriodsPerDay: 6,
      gradeClassCounts: { 1: 2 },
    })
    schoolIds.subjectMap = await createTestSubjects(page)

    teacherIds = await createTestTeachers(
      page,
      [
        { name: "T0国語", mainSubject: "国語", maxPeriodsPerWeek: 25 },
        { name: "T1数学", mainSubject: "数学", maxPeriodsPerWeek: 25 },
        { name: "T2理科", mainSubject: "理科", maxPeriodsPerWeek: 25 },
        { name: "T3英語", mainSubject: "英語", maxPeriodsPerWeek: 25 },
      ],
      schoolIds.subjectMap
    )

    // T0: 月曜1-3限 unavailable
    await setTeacherAvailabilities(page, teacherIds, [
      { teacherIndex: 0, dayOfWeek: 1, period: 1, status: "unavailable" },
      { teacherIndex: 0, dayOfWeek: 1, period: 2, status: "unavailable" },
      { teacherIndex: 0, dayOfWeek: 1, period: 3, status: "unavailable" },
    ])

    // T1: 火曜5限に校務(給食指導)
    await createTestDuties(
      page,
      [{ name: "給食指導", dayOfWeek: 2, period: 5, teacherIndices: [1] }],
      teacherIds
    )

    // 理科室 + 金曜5-6限 unavailable
    roomIds = await createTestRooms(page, [
      { name: "理科室", shortName: "理" },
    ])
    await setRoomAvailabilities(page, roomIds, [
      { roomIndex: 0, dayOfWeek: 5, period: 5, status: "unavailable" },
      { roomIndex: 0, dayOfWeek: 5, period: 6, status: "unavailable" },
    ])

    // 10駒 (各クラス16h)
    // T0: 国語 4h×2 = 8h
    // T1: 数学 4h×2 = 8h
    // T2: 理科 3h×2 = 6h (理科室使用)
    // T3: 英語 5h×2 = 10h (残りスロットを埋める)
    const komaDefs = [
      { subjectName: "国語", gradeNum: 1, classIndices: [0], teacherIndices: [0], count: 4 },
      { subjectName: "国語", gradeNum: 1, classIndices: [1], teacherIndices: [0], count: 4 },
      { subjectName: "数学", gradeNum: 1, classIndices: [0], teacherIndices: [1], count: 4 },
      { subjectName: "数学", gradeNum: 1, classIndices: [1], teacherIndices: [1], count: 4 },
      { subjectName: "理科", gradeNum: 1, classIndices: [0], teacherIndices: [2], roomIndices: [0], count: 3 },
      { subjectName: "理科", gradeNum: 1, classIndices: [1], teacherIndices: [2], roomIndices: [0], count: 3 },
      { subjectName: "英語", gradeNum: 1, classIndices: [0], teacherIndices: [3], count: 5 },
      { subjectName: "英語", gradeNum: 1, classIndices: [1], teacherIndices: [3], count: 5 },
    ]

    await createTestKomas(page, komaDefs, schoolIds, teacherIds, roomIds)

    const allKomas = await page.evaluate(() => window.electronAPI.komaGetAll())
    const totalSlots = allKomas.reduce((sum, k) => sum + k.count, 0)
    expect(totalSlots).toBe(32)
  })

  // ── テスト1: forbidden ──────────────

  test("forbidden: T0は月曜1-3限に配置なし、T1は火曜5限に配置なし、理科は金曜5-6限に配置なし", async () => {
    test.setTimeout(120_000)

    // 全制約 forbidden
    await createTestCondition(page, {
      teacherAvailability: "forbidden",
      teacherAvailabilityWeight: 100,
      roomAvailability: "forbidden",
      roomAvailabilityWeight: 100,
      dutyConflict: "forbidden",
      dutyConflictWeight: 100,
    })

    const { patternId, slotCount } = await runSolverViaUI(page, 60_000)
    expect(slotCount).toBeGreaterThan(0)

    const patternWithSlots = await page.evaluate(
      async (id) => window.electronAPI.patternGetWithSlots(id),
      patternId
    )
    const slots = patternWithSlots?.slots ?? []
    const komas = await page.evaluate(() => window.electronAPI.komaGetAll())
    const komaMap = new Map(komas.map((k) => [k.id, k]))

    // T0(teacherIds[0]) は月曜1-3限に配置されていないこと
    for (const slot of slots) {
      const koma = komaMap.get(slot.komaId)
      if (!koma) continue
      const hasT0 = koma.komaTeachers?.some((kt) => kt.teacherId === teacherIds[0])
      if (hasT0 && slot.dayOfWeek === 1) {
        expect(slot.period).toBeGreaterThan(3)
      }
    }

    // T1(teacherIds[1]) は火曜5限に配置されていないこと
    for (const slot of slots) {
      const koma = komaMap.get(slot.komaId)
      if (!koma) continue
      const hasT1 = koma.komaTeachers?.some((kt) => kt.teacherId === teacherIds[1])
      if (hasT1 && slot.dayOfWeek === 2) {
        expect(slot.period).not.toBe(5)
      }
    }

    // 理科(理科室使用)は金曜5-6限に配置されていないこと
    const scienceSubjectId = schoolIds.subjectMap["理科"]
    for (const slot of slots) {
      const koma = komaMap.get(slot.komaId)
      if (!koma) continue
      if (koma.subjectId === scienceSubjectId && slot.dayOfWeek === 5) {
        expect(slot.period).toBeLessThanOrEqual(4)
      }
    }

    // 後続テスト用にパターン削除
    await page.evaluate(
      async (id) => window.electronAPI.patternDelete(id),
      patternId
    )
  })

  // ── テスト2: consider ──────────────

  test("consider: teacherAvailability を consider に変更しソルバー実行", async () => {
    test.setTimeout(120_000)

    // teacherAvailability を consider に変更
    await page.evaluate(async () => {
      await window.electronAPI.conditionUpsert({
        teacherAvailability: "consider",
        teacherAvailabilityWeight: 50,
      })
    })

    const { patternId, slotCount } = await runSolverViaUI(page, 60_000)
    expect(slotCount).toBeGreaterThan(0)

    // consider なので月曜1-3限への配置は許容される（warningとして）
    // ただし他に空きがあれば避けるはず
    console.log(`[consider] 配置スロット数: ${slotCount} / 32`)

    await page.evaluate(
      async (id) => window.electronAPI.patternDelete(id),
      patternId
    )
  })

  // ── テスト3: ignore ──────────────

  test("ignore: teacherAvailability を ignore に変更しソルバー実行", async () => {
    test.setTimeout(120_000)

    // teacherAvailability を ignore に変更
    await page.evaluate(async () => {
      await window.electronAPI.conditionUpsert({
        teacherAvailability: "ignore",
        teacherAvailabilityWeight: 0,
      })
    })

    const { patternId, slotCount } = await runSolverViaUI(page, 60_000)
    expect(slotCount).toBeGreaterThan(0)

    // ignore なので制約なしで自由に配置される
    console.log(`[ignore] 配置スロット数: ${slotCount} / 32`)

    await page.evaluate(
      async (id) => window.electronAPI.patternDelete(id),
      patternId
    )
  })
})
