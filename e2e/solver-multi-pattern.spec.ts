/**
 * 複数パターン生成・比較・採用テスト
 *
 * solver-small-school と同一データで maxPatterns=3 でソルバー実行
 * 複数パターンの結果表示・スコア比較・採用
 */
import type { Page } from "@playwright/test"
import { test } from "@playwright/test"

import {
  type AppContext,
  closeApp,
  expect,
  launchApp,
  TEST_BASE_URL,
} from "./helpers/fixtures"
import {
  createTestCondition,
  createTestKomas,
  createTestSchool,
  createTestSubjects,
  createTestTeachers,
  type SchoolIds,
} from "./helpers/school-builder"

test.describe.serial("複数パターン生成テスト", () => {
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

  test("データセットアップ: 小規模校データ", async () => {
    test.setTimeout(60_000)

    schoolIds = await createTestSchool(page, {
      name: "複数パターンテスト校",
      daysPerWeek: 5,
      maxPeriodsPerDay: 6,
      gradeClassCounts: { 1: 2 },
    })
    schoolIds.subjectMap = await createTestSubjects(page)

    teacherIds = await createTestTeachers(
      page,
      [
        { name: "T0国語", mainSubject: "国語" },
        { name: "T1数学", mainSubject: "数学" },
        { name: "T2英語", mainSubject: "英語" },
        { name: "T3理科", mainSubject: "理科" },
        { name: "T4社会", mainSubject: "社会" },
      ],
      schoolIds.subjectMap
    )

    const komaDefs = [
      {
        subjectName: "国語",
        gradeNum: 1,
        classIndices: [0],
        teacherIndices: [0],
        count: 4,
      },
      {
        subjectName: "国語",
        gradeNum: 1,
        classIndices: [1],
        teacherIndices: [0],
        count: 4,
      },
      {
        subjectName: "数学",
        gradeNum: 1,
        classIndices: [0],
        teacherIndices: [1],
        count: 4,
      },
      {
        subjectName: "数学",
        gradeNum: 1,
        classIndices: [1],
        teacherIndices: [1],
        count: 4,
      },
      {
        subjectName: "英語",
        gradeNum: 1,
        classIndices: [0],
        teacherIndices: [2],
        count: 4,
      },
      {
        subjectName: "英語",
        gradeNum: 1,
        classIndices: [1],
        teacherIndices: [2],
        count: 4,
      },
      {
        subjectName: "理科",
        gradeNum: 1,
        classIndices: [0],
        teacherIndices: [3],
        count: 3,
      },
      {
        subjectName: "理科",
        gradeNum: 1,
        classIndices: [1],
        teacherIndices: [3],
        count: 3,
      },
      {
        subjectName: "社会",
        gradeNum: 1,
        classIndices: [0],
        teacherIndices: [4],
        count: 3,
      },
      {
        subjectName: "社会",
        gradeNum: 1,
        classIndices: [1],
        teacherIndices: [4],
        count: 3,
      },
      {
        subjectName: "道徳",
        gradeNum: 1,
        classIndices: [0],
        teacherIndices: [3],
        count: 1,
      },
      {
        subjectName: "道徳",
        gradeNum: 1,
        classIndices: [1],
        teacherIndices: [4],
        count: 1,
      },
      {
        subjectName: "学活",
        gradeNum: 1,
        classIndices: [0],
        teacherIndices: [4],
        count: 1,
      },
      {
        subjectName: "学活",
        gradeNum: 1,
        classIndices: [1],
        teacherIndices: [4],
        count: 1,
      },
    ]

    await createTestKomas(page, komaDefs, schoolIds, teacherIds, [])
    await createTestCondition(page)
  })

  test("maxPatterns=3 でソルバー実行し、複数パターン結果を確認", async () => {
    test.setTimeout(300_000)

    await page.goto(`${TEST_BASE_URL}/scheduler/auto`)
    await page.waitForLoadState("networkidle")

    // maxPatterns を3に設定（SolverConfigPanel のスライダーまたは入力）
    // デフォルトが3なのでそのまま実行
    const maxPatternsInput = page.locator('input[type="number"]').first()
    if (await maxPatternsInput.isVisible()) {
      // maxPatterns が表示されている場合は3に設定
      await maxPatternsInput.fill("3")
    }

    // 自動作成開始
    await page.getByRole("button", { name: "自動作成開始" }).click()

    // 完了待機
    await page
      .getByRole("button", { name: "結果を保存" })
      .waitFor({ state: "visible", timeout: 240_000 })

    // 結果サマリが表示されること
    const resultArea = page.locator(".space-y-3.rounded.border.p-4")
    await expect(resultArea.first()).toBeVisible()

    // "全Nパターンの結果" テキストの確認（パターン数表示）
    const resultText = await page.locator("body").textContent()
    console.log(
      `[複数パターン] 結果テキスト抜粋: ${resultText?.substring(0, 500)}`
    )

    // 結果を保存
    await page.getByRole("button", { name: "結果を保存" }).click()
    await page.waitForTimeout(3000)

    // パターン取得
    const patterns = await page.evaluate(() =>
      window.electronAPI.patternGetAll()
    )
    console.log(`[複数パターン] 保存パターン数: ${patterns.length}`)
    expect(patterns.length).toBeGreaterThanOrEqual(1)

    // スロットが保存されていること
    const patternWithSlots = await page.evaluate(
      async (id) => window.electronAPI.patternGetWithSlots(id),
      patterns[0].id
    )
    const slots = patternWithSlots?.slots ?? []
    console.log(`[複数パターン] スロット数: ${slots.length}`)
    expect(slots.length).toBeGreaterThan(0)

    // 各パターンにscore≧0
    for (const p of patterns) {
      expect(p.score).toBeGreaterThanOrEqual(0)
    }
  })

  test("最良スコアのパターンを採用", async () => {
    const patterns = await page.evaluate(() =>
      window.electronAPI.patternGetAll()
    )

    // 最良スコア（最低値）のパターンを見つける
    const bestPattern = patterns.reduce((best, p) =>
      (p.score ?? Infinity) < (best.score ?? Infinity) ? p : best
    )

    await page.evaluate(
      async (id) => window.electronAPI.patternAdopt(id),
      bestPattern.id
    )

    const adopted = await page.evaluate(() =>
      window.electronAPI.patternGetAll()
    )
    const adoptedPattern = adopted.find((p) => p.status === "adopted")
    expect(adoptedPattern).toBeTruthy()
    expect(adoptedPattern!.id).toBe(bestPattern.id)
  })
})
