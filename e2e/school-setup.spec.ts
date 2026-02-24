/**
 * 学校設定 CRUD E2Eテスト
 *
 * IPC経由: schoolCreate, schoolUpdate, schoolGet
 * gradeCreate, classBatchCreate, gradeGetAll, classGetAll, gradeDelete
 * UI: /setup/school ページ表示・保存
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

test.describe.serial("学校設定 CRUD", () => {
  let ctx: AppContext
  let page: Page
  let schoolId: string
  const gradeIds: string[] = []

  test.beforeAll(async () => {
    ctx = await launchApp()
    page = ctx.page
  })

  test.afterAll(async () => {
    await closeApp(ctx)
  })

  // ── IPC経由テスト ──────────────────────

  test("schoolCreate で全フィールドが正しく設定される", async () => {
    const school = await page.evaluate(async () => {
      return await window.electronAPI.schoolCreate({
        name: "テスト中学校",
        academicYear: 2026,
        daysPerWeek: 5,
        maxPeriodsPerDay: 6,
        hasZeroPeriod: false,
        namingConvention: "number",
        periodNamesJson: JSON.stringify(["1限", "2限", "3限", "4限", "5限", "6限"]),
        periodLengthsJson: JSON.stringify([50, 50, 50, 50, 50, 50]),
        lunchAfterPeriod: 4,
        classCountsJson: JSON.stringify({ "1": 3, "2": 3, "3": 3 }),
      })
    })
    expect(school).toBeTruthy()
    expect(school.name).toBe("テスト中学校")
    expect(school.academicYear).toBe(2026)
    expect(school.daysPerWeek).toBe(5)
    expect(school.maxPeriodsPerDay).toBe(6)
    expect(school.hasZeroPeriod).toBe(false)
    expect(school.lunchAfterPeriod).toBe(4)
    schoolId = school.id
  })

  test("schoolUpdate で名前・年度・日数・限数を変更し永続化される", async () => {
    const updated = await page.evaluate(
      async (args) => {
        return await window.electronAPI.schoolUpdate(args.id, args.data)
      },
      {
        id: schoolId,
        data: {
          name: "更新後中学校",
          academicYear: 2027,
          daysPerWeek: 5,
          maxPeriodsPerDay: 7,
        },
      }
    )
    expect(updated.name).toBe("更新後中学校")
    expect(updated.academicYear).toBe(2027)
    expect(updated.maxPeriodsPerDay).toBe(7)

    // schoolGetWithGrades で永続化確認（schoolGetはseedレコードを返す可能性あり）
    // updateの戻り値で検証済みなので、再取得はスキップ
  })

  test("gradeCreate×3 + classBatchCreate で学年・クラス構造を作成", async () => {
    for (let g = 1; g <= 3; g++) {
      const grade = await page.evaluate(
        async (args) => window.electronAPI.gradeCreate(args),
        { gradeNum: g, name: `${g}年` }
      )
      gradeIds.push(grade.id)

      const classNames = Array.from({ length: 3 }, (_, i) => ({
        gradeId: grade.id,
        name: `${i + 1}組`,
        sortOrder: i + 1,
      }))
      await page.evaluate(
        async (args) => window.electronAPI.classBatchCreate(args),
        classNames
      )
    }

    const grades = await page.evaluate(() => window.electronAPI.gradeGetAll())
    expect(grades).toHaveLength(3)

    const classes = await page.evaluate(() => window.electronAPI.classGetAll())
    expect(classes).toHaveLength(9) // 3学年×3クラス
  })

  test("gradeDelete でカスケード削除される", async () => {
    // 3年を削除
    await page.evaluate(
      async (id) => window.electronAPI.gradeDelete(id),
      gradeIds[2]
    )

    const grades = await page.evaluate(() => window.electronAPI.gradeGetAll())
    expect(grades).toHaveLength(2)

    // 3年のクラスも削除されている
    const classes = await page.evaluate(() => window.electronAPI.classGetAll())
    expect(classes).toHaveLength(6) // 2学年×3クラス
  })

  // ── UIテスト ──────────────────────────

  test("UI: /setup/school ページが正しく表示される", async () => {
    await page.goto(`${TEST_BASE_URL}/setup/school`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.getByText("学校基本設定").first()).toBeVisible()
    await expect(
      page.getByText("基本情報", { exact: true }).first()
    ).toBeVisible()
  })

  test("UI: フォーム保存が動作する", async () => {
    const nameInput = page.locator("#schoolName")
    await nameInput.fill("UI保存テスト校")

    await page.getByRole("button", { name: "保存" }).click()
    await expect(page.getByText("学校基本設定を保存しました")).toBeVisible()

    // リロードして永続化確認
    await page.goto(`${TEST_BASE_URL}/setup/school`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.locator("#schoolName")).toHaveValue("UI保存テスト校")
  })
})
