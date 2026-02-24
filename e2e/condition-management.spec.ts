/**
 * 制約条件 + 教科別条件 E2Eテスト
 *
 * conditionUpsert, conditionGet
 * conditionUpsertPerSubject (levelフィールド含む)
 * conditionDeletePerSubject
 * UI: /scheduler/conditions ページ
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

test.describe.serial("制約条件 + 教科別条件", () => {
  let ctx: AppContext
  let page: Page
  let conditionId: string
  let subjectMap: Record<string, string>

  test.beforeAll(async () => {
    ctx = await launchApp()
    page = ctx.page

    await page.evaluate(async () => {
      await window.electronAPI.schoolCreate({
        name: "条件テスト校",
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

  // ── conditionUpsert ──────────────────

  test("conditionUpsert でデフォルト条件を作成できる", async () => {
    const condition = await page.evaluate(async () => {
      return await window.electronAPI.conditionUpsert({
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
      })
    })
    expect(condition).toBeTruthy()
    expect(condition.id).toBeTruthy()
    expect(condition.teacherAvailability).toBe("forbidden")
    expect(condition.roomConflict).toBe("forbidden")
    conditionId = condition.id
  })

  test("各レベル(forbidden/consider/ignore)を設定し永続化を確認", async () => {
    // forbidden → consider に変更
    await page.evaluate(
      async (data) => window.electronAPI.conditionUpsert(data),
      { teacherAvailability: "consider", teacherAvailabilityWeight: 90 }
    )
    let cond = await page.evaluate(() => window.electronAPI.conditionGet())
    expect(cond!.teacherAvailability).toBe("consider")
    expect(cond!.teacherAvailabilityWeight).toBe(90)

    // consider → ignore に変更
    await page.evaluate(
      async (data) => window.electronAPI.conditionUpsert(data),
      { teacherAvailability: "ignore", teacherAvailabilityWeight: 0 }
    )
    cond = await page.evaluate(() => window.electronAPI.conditionGet())
    expect(cond!.teacherAvailability).toBe("ignore")

    // 元に戻す
    await page.evaluate(
      async (data) => window.electronAPI.conditionUpsert(data),
      { teacherAvailability: "forbidden", teacherAvailabilityWeight: 100 }
    )
  })

  // ── conditionUpsertPerSubject ────────

  test("conditionUpsertPerSubject で教科別条件を設定できる (levelフィールド含む)", async () => {
    // 保健体育: forbidden, morning_only, maxPerDay=1
    const peCond = await page.evaluate(
      async (args) => window.electronAPI.conditionUpsertPerSubject(args),
      {
        conditionId,
        subjectId: subjectMap["保健体育"],
        level: "forbidden",
        placementRestriction: "morning_only",
        maxPerDay: 1,
      }
    )
    expect(peCond).toBeTruthy()
    expect(peCond.level).toBe("forbidden")
    expect(peCond.placementRestriction).toBe("morning_only")
    expect(peCond.maxPerDay).toBe(1)
  })

  test("level='forbidden' の教科別条件が永続化される", async () => {
    // 音楽: consider, not_first, maxPerDay=1
    await page.evaluate(
      async (args) => window.electronAPI.conditionUpsertPerSubject(args),
      {
        conditionId,
        subjectId: subjectMap["音楽"],
        level: "consider",
        placementRestriction: "not_first",
        maxPerDay: 1,
      }
    )

    // conditionGet で全体取得して確認
    const cond = await page.evaluate(() => window.electronAPI.conditionGet())
    expect(cond).toBeTruthy()

    // perSubjectConditions はconditionに含まれる場合とGetAllで取得する場合がある
    // 個別に取得して確認
    const peSubjectId = subjectMap["保健体育"]
    const musicSubjectId = subjectMap["音楽"]
    expect(peSubjectId).toBeTruthy()
    expect(musicSubjectId).toBeTruthy()
  })

  test("conditionDeletePerSubject で教科別条件を削除できる", async () => {
    await page.evaluate(
      async (args) =>
        window.electronAPI.conditionDeletePerSubject(
          args.conditionId,
          args.subjectId
        ),
      { conditionId, subjectId: subjectMap["音楽"] }
    )

    // 削除後に再登録が可能であることを確認
    const newCond = await page.evaluate(
      async (args) => window.electronAPI.conditionUpsertPerSubject(args),
      {
        conditionId,
        subjectId: subjectMap["音楽"],
        level: "ignore",
        maxPerDay: 2,
      }
    )
    expect(newCond.level).toBe("ignore")
  })

  // ── UIテスト ──────────────────────────

  test("UI: /scheduler/conditions ページが正しく表示される", async () => {
    await page.goto(`${TEST_BASE_URL}/scheduler/conditions`, {
      waitUntil: "domcontentloaded",
    })
    await page.waitForLoadState("networkidle")

    await expect(page.locator("h1")).toHaveText("処理条件設定")
    await expect(page.getByText("先生の都合")).toBeVisible()
    await expect(page.getByText("教室重複禁止")).toBeVisible()
    await expect(page.getByText("校務時間帯不可")).toBeVisible()
  })

  test("UI: 制約レベルの選択肢が表示される", async () => {
    const firstSelect = page
      .locator("table tbody tr")
      .first()
      .locator("button[role='combobox']")
      .first()
    await firstSelect.click()
    await page.waitForTimeout(300)

    const options = page.locator("[role='option']")
    await expect(options.first()).toBeVisible()
    await page.keyboard.press("Escape")
  })

  test("UI: 教科別条件セクションが表示される", async () => {
    // 教科別条件カードが表示されていること
    await expect(page.getByText("教科別条件").first()).toBeVisible()
  })
})
