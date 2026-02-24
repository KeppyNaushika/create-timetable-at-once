/**
 * 先生管理 + 空き時間設定 E2Eテスト
 *
 * teacherCreate, teacherBatchImport, teacherUpdate, teacherDelete
 * teacherAvailabilityBatchUpsert, teacherGetWithAvailabilities
 * UI: /data/teachers ページ
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
import { createTestSubjects } from "./helpers/school-builder"

test.describe.serial("先生管理 + 空き時間設定", () => {
  let ctx: AppContext
  let page: Page
  let subjectMap: Record<string, string>
  let singleTeacherId: string
  const batchTeacherIds: string[] = []

  test.beforeAll(async () => {
    ctx = await launchApp()
    page = ctx.page

    // 前提: 学校 + 教科
    await page.evaluate(async () => {
      await window.electronAPI.schoolCreate({
        name: "先生テスト校",
        academicYear: 2026,
        daysPerWeek: 5,
        maxPeriodsPerDay: 6,
        hasZeroPeriod: false,
        namingConvention: "number",
        periodNamesJson: JSON.stringify(["1限", "2限", "3限", "4限", "5限", "6限"]),
        periodLengthsJson: JSON.stringify([50, 50, 50, 50, 50, 50]),
        lunchAfterPeriod: 4,
        classCountsJson: JSON.stringify({ "1": 2 }),
      })
    })
    subjectMap = await createTestSubjects(page)
  })

  test.afterAll(async () => {
    await closeApp(ctx)
  })

  test("teacherCreate で全フィールドが検証される", async () => {
    const teacher = await page.evaluate(
      async (data) => window.electronAPI.teacherCreate(data),
      {
        name: "山田太郎",
        nameKana: "やまだたろう",
        mainSubjectId: subjectMap["国語"],
        maxPeriodsPerWeek: 20,
        maxPerDay: 5,
        maxConsecutive: 3,
      }
    )
    expect(teacher.name).toBe("山田太郎")
    expect(teacher.maxPeriodsPerWeek).toBe(20)
    expect(teacher.maxPerDay).toBe(5)
    expect(teacher.maxConsecutive).toBe(3)
    singleTeacherId = teacher.id
  })

  test("teacherBatchImport で5名一括登録できる", async () => {
    const data = [
      { name: "佐藤一郎", nameKana: "", mainSubjectId: subjectMap["数学"], maxPeriodsPerWeek: 25, maxPerDay: 6, maxConsecutive: 4 },
      { name: "鈴木花子", nameKana: "", mainSubjectId: subjectMap["英語"], maxPeriodsPerWeek: 25, maxPerDay: 6, maxConsecutive: 4 },
      { name: "高橋健太", nameKana: "", mainSubjectId: subjectMap["理科"], maxPeriodsPerWeek: 25, maxPerDay: 6, maxConsecutive: 4 },
      { name: "田中美咲", nameKana: "", mainSubjectId: subjectMap["社会"], maxPeriodsPerWeek: 25, maxPerDay: 6, maxConsecutive: 4 },
      { name: "伊藤翔太", nameKana: "", mainSubjectId: subjectMap["音楽"], maxPeriodsPerWeek: 25, maxPerDay: 6, maxConsecutive: 4 },
    ]
    const teachers = await page.evaluate(
      async (d) => window.electronAPI.teacherBatchImport(d),
      data
    )
    expect(teachers).toHaveLength(5)
    for (const t of teachers) {
      batchTeacherIds.push(t.id)
    }
  })

  test("teacherAvailabilityBatchUpsert で空き設定を一括登録", async () => {
    // 山田太郎: 月曜1限=unavailable, 水曜3限=preferred
    const items = [
      { teacherId: singleTeacherId, dayOfWeek: 1, period: 1, status: "unavailable" },
      { teacherId: singleTeacherId, dayOfWeek: 3, period: 3, status: "preferred" },
    ]
    const results = await page.evaluate(
      async (data) => window.electronAPI.teacherAvailabilityBatchUpsert(data),
      items
    )
    expect(results).toHaveLength(2)
  })

  test("teacherGetWithAvailabilities で設定の永続化を確認", async () => {
    const teacher = await page.evaluate(
      async (id) => window.electronAPI.teacherGetWithAvailabilities(id),
      singleTeacherId
    )
    expect(teacher).toBeTruthy()

    const avails = await page.evaluate(
      async (id) => window.electronAPI.teacherAvailabilityGetByTeacherId(id),
      singleTeacherId
    )
    expect(avails.length).toBeGreaterThanOrEqual(2)

    const unavailable = avails.find(
      (a) => a.dayOfWeek === 1 && a.period === 1
    )
    expect(unavailable).toBeTruthy()
    expect(unavailable!.status).toBe("unavailable")

    const preferred = avails.find(
      (a) => a.dayOfWeek === 3 && a.period === 3
    )
    expect(preferred).toBeTruthy()
    expect(preferred!.status).toBe("preferred")
  })

  test("teacherUpdate で情報を変更できる", async () => {
    const updated = await page.evaluate(
      async (args) => window.electronAPI.teacherUpdate(args.id, args.data),
      { id: singleTeacherId, data: { name: "山田次郎", maxPerDay: 4 } }
    )
    expect(updated.name).toBe("山田次郎")
    expect(updated.maxPerDay).toBe(4)
  })

  test("teacherDelete で教員を削除できる", async () => {
    const before = await page.evaluate(() => window.electronAPI.teacherGetAll())
    const count = before.length

    await page.evaluate(
      async (id) => window.electronAPI.teacherDelete(id),
      singleTeacherId
    )

    const after = await page.evaluate(() => window.electronAPI.teacherGetAll())
    expect(after.length).toBe(count - 1)
  })

  // ── UIテスト ──────────────────────────

  test("UI: /data/teachers ページで先生一覧が表示される", async () => {
    await page.goto(`${TEST_BASE_URL}/data/teachers`, {
      waitUntil: "domcontentloaded",
    })
    await page.waitForLoadState("networkidle")

    // 一括登録した5名が表示されること
    await expect(page.getByText("佐藤一郎")).toBeVisible()
    await expect(page.getByText("鈴木花子")).toBeVisible()
  })
})
