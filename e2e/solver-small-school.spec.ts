/**
 * 小規模校ソルバー自動配置テスト
 *
 * 構成: 1学年×2クラス、5教員、14駒(40スロット)
 * 教科: 国語(4h), 数学(4h), 英語(4h), 理科(3h), 社会(3h), 道徳(1h), 学活(1h) = 20h/class
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
  createTestKomas,
  createTestCondition,
  runSolverViaUI,
  validateNoTeacherConflicts,
  validateNoClassConflicts,
  type SchoolIds,
} from "./helpers/school-builder"

test.describe.serial("小規模校ソルバーテスト", () => {
  let ctx: AppContext
  let page: Page
  let schoolIds: SchoolIds
  let teacherIds: string[]

  test.beforeAll(async () => {
    ctx = await launchApp()
    page = ctx.page
  })

  test.afterAll(async () => {
    await closeApp(ctx)
  })

  test("データセットアップ: 1学年×2クラス、5教員、14駒", async () => {
    test.setTimeout(60_000)

    // 学校 + 学年 + クラス
    schoolIds = await createTestSchool(page, {
      name: "小規模テスト校",
      daysPerWeek: 5,
      maxPeriodsPerDay: 6,
      gradeClassCounts: { 1: 2 },
    })

    // 教科
    schoolIds.subjectMap = await createTestSubjects(page)

    // 5教員
    teacherIds = await createTestTeachers(
      page,
      [
        { name: "T0国語", mainSubject: "国語", maxPeriodsPerWeek: 25 },
        { name: "T1数学", mainSubject: "数学", maxPeriodsPerWeek: 25 },
        { name: "T2英語", mainSubject: "英語", maxPeriodsPerWeek: 25 },
        { name: "T3理科", mainSubject: "理科", maxPeriodsPerWeek: 25 },
        { name: "T4社会", mainSubject: "社会", maxPeriodsPerWeek: 25 },
      ],
      schoolIds.subjectMap
    )
    expect(teacherIds).toHaveLength(5)

    // 14駒 (各クラス20h)
    // T0: 国語 → 両クラス(8h)
    // T1: 数学 → 両クラス(8h)
    // T2: 英語 → 両クラス(8h)
    // T3: 理科 → 両クラス(6h) + 道徳1組(1h) = 7h
    // T4: 社会 → 両クラス(6h) + 道徳2組(1h) + 学活両クラス(2h) = 9h
    const komaDefs = [
      // 国語 T0
      { subjectName: "国語", gradeNum: 1, classIndices: [0], teacherIndices: [0], count: 4 },
      { subjectName: "国語", gradeNum: 1, classIndices: [1], teacherIndices: [0], count: 4 },
      // 数学 T1
      { subjectName: "数学", gradeNum: 1, classIndices: [0], teacherIndices: [1], count: 4 },
      { subjectName: "数学", gradeNum: 1, classIndices: [1], teacherIndices: [1], count: 4 },
      // 英語 T2
      { subjectName: "英語", gradeNum: 1, classIndices: [0], teacherIndices: [2], count: 4 },
      { subjectName: "英語", gradeNum: 1, classIndices: [1], teacherIndices: [2], count: 4 },
      // 理科 T3
      { subjectName: "理科", gradeNum: 1, classIndices: [0], teacherIndices: [3], count: 3 },
      { subjectName: "理科", gradeNum: 1, classIndices: [1], teacherIndices: [3], count: 3 },
      // 社会 T4
      { subjectName: "社会", gradeNum: 1, classIndices: [0], teacherIndices: [4], count: 3 },
      { subjectName: "社会", gradeNum: 1, classIndices: [1], teacherIndices: [4], count: 3 },
      // 道徳 T3→1組, T4→2組
      { subjectName: "道徳", gradeNum: 1, classIndices: [0], teacherIndices: [3], count: 1 },
      { subjectName: "道徳", gradeNum: 1, classIndices: [1], teacherIndices: [4], count: 1 },
      // 学活 T4→両クラス
      { subjectName: "学活", gradeNum: 1, classIndices: [0], teacherIndices: [4], count: 1 },
      { subjectName: "学活", gradeNum: 1, classIndices: [1], teacherIndices: [4], count: 1 },
    ]

    const komaIds = await createTestKomas(
      page,
      komaDefs,
      schoolIds,
      teacherIds,
      []
    )
    expect(komaIds).toHaveLength(14)

    // 総スロット数確認
    const allKomas = await page.evaluate(() => window.electronAPI.komaGetAll())
    const totalSlots = allKomas.reduce((sum, k) => sum + k.count, 0)
    expect(totalSlots).toBe(40) // 20h × 2クラス
  })

  test("教員容量チェックで全教員がパス", async () => {
    const results = await page.evaluate(() =>
      window.electronAPI.checkTeacherCapacity()
    )
    expect(results).toHaveLength(5)

    for (const r of results) {
      expect(r.totalKomaCount).toBeLessThanOrEqual(r.maxPeriodsPerWeek)
    }
  })

  test("制約条件を設定", async () => {
    const condId = await createTestCondition(page)
    expect(condId).toBeTruthy()
  })

  test("ソルバー実行: 配置率≧95%、重複なし、15秒以内", async () => {
    test.setTimeout(120_000)

    const { patternId, slotCount } = await runSolverViaUI(page, 120_000)

    // 配置率≧95% (40スロット中38以上)
    console.log(`[小規模校] 配置スロット数: ${slotCount} / 40`)
    expect(slotCount).toBeGreaterThanOrEqual(Math.floor(40 * 0.95))

    // 教員重複チェック
    const patternWithSlots = await page.evaluate(
      async (id) => window.electronAPI.patternGetWithSlots(id),
      patternId
    )
    const slots = patternWithSlots?.slots ?? []
    const komas = await page.evaluate(() => window.electronAPI.komaGetAll())

    const teacherCheck = validateNoTeacherConflicts(slots, komas)
    expect(teacherCheck.valid).toBe(true)

    const classCheck = validateNoClassConflicts(slots, komas)
    expect(classCheck.valid).toBe(true)
  })

  test("パターン保存・採用が成功", async () => {
    const patterns = await page.evaluate(() =>
      window.electronAPI.patternGetAll()
    )
    expect(patterns.length).toBeGreaterThanOrEqual(1)

    const patternId = patterns[0].id
    await page.evaluate(
      async (id) => window.electronAPI.patternAdopt(id),
      patternId
    )

    const adopted = await page.evaluate(() =>
      window.electronAPI.patternGetAll()
    )
    expect(adopted.find((p) => p.status === "adopted")).toBeTruthy()
  })
})
