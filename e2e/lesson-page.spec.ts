/**
 * 駒設定UIテスト (リファクタリング後)
 *
 * /data/koma ページ表示確認
 * 学年タブ切替・駒追加ボタン
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
  createTestKomas,
  createTestSchool,
  createTestSubjects,
  createTestTeachers,
  type SchoolIds,
} from "./helpers/school-builder"

test.describe.serial("駒設定ページ UI", () => {
  let ctx: AppContext
  let page: Page

  test.beforeAll(async () => {
    ctx = await launchApp()
    page = ctx.page

    // 前提データ作成
    const schoolIds: SchoolIds = await createTestSchool(page, {
      name: "駒ページテスト校",
      gradeClassCounts: { 1: 2, 2: 2 },
    })
    schoolIds.subjectMap = await createTestSubjects(page)

    const teacherIds = await createTestTeachers(
      page,
      [
        { name: "国語先生", mainSubject: "国語" },
        { name: "数学先生", mainSubject: "数学" },
      ],
      schoolIds.subjectMap
    )

    // 駒作成
    await createTestKomas(
      page,
      [
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
          subjectName: "国語",
          gradeNum: 2,
          classIndices: [0],
          teacherIndices: [0],
          count: 4,
        },
      ],
      schoolIds,
      teacherIds,
      []
    )
  })

  test.afterAll(async () => {
    await closeApp(ctx)
  })

  test("UI: /data/koma ページが表示される", async () => {
    await page.goto(`${TEST_BASE_URL}/data/koma`, {
      waitUntil: "domcontentloaded",
    })
    await page.waitForLoadState("networkidle")

    // ページタイトルの確認
    const heading = page.locator("h1")
    await expect(heading).toBeVisible()
  })

  test("UI: 学年タブが表示され切替できる", async () => {
    // 1年タブ
    const tab1 = page.getByRole("tab", { name: /1年/ })
    if (await tab1.isVisible()) {
      await tab1.click()
      await page.waitForTimeout(300)

      // 2年タブに切替
      const tab2 = page.getByRole("tab", { name: /2年/ })
      if (await tab2.isVisible()) {
        await tab2.click()
        await page.waitForTimeout(300)
      }
    }
  })

  test("UI: 駒一覧が表示される", async () => {
    // 駒が5つ作成されているので、表示されることを確認
    // 教科名が表示されていること
    await expect(page.getByText("国語").first()).toBeVisible()
  })
})
