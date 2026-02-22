import { test } from "@playwright/test"
import type { Page } from "@playwright/test"

import {
  type AppContext,
  closeApp,
  expect,
  launchApp,
} from "./helpers/fixtures"

let ctx: AppContext
let page: Page

test.beforeAll(async () => {
  ctx = await launchApp()
  page = ctx.page
})

test.afterAll(async () => {
  await closeApp(ctx)
})

test("ダッシュボードが表示される", async () => {
  await expect(page.locator("h1")).toHaveText("一括時間割作成")
  await expect(page.locator("h2").first()).toHaveText("初期設定")
  await expect(page.locator("h2").nth(1)).toHaveText("データ入力")
  await expect(page.locator("h2").nth(2)).toHaveText("時間割作成")
})

test("全ナビカード（13枚）が存在する", async () => {
  const titles = [
    "学校基本設定",
    "科目設定",
    "基本時間割枠",
    "先生設定",
    "クラス設定",
    "特別教室",
    "校務",
    "駒設定",
    "処理条件",
    "駒チェック",
    "手動配置",
    "自動作成",
    "パターン比較",
  ]
  for (const title of titles) {
    await expect(page.getByText(title, { exact: false }).first()).toBeVisible()
  }
})

test("学校基本設定カードから遷移できる", async () => {
  await page.getByText("学校基本設定").first().click()
  await expect(page.getByText("学校基本設定").first()).toBeVisible()
  await page.goBack()
})

test("科目設定カードから遷移できる", async () => {
  await page.getByText("科目設定").first().click()
  await expect(page.getByText("科目設定").first()).toBeVisible()
  await page.goBack()
})

test("先生設定カードから遷移できる", async () => {
  await page.getByText("先生設定").first().click()
  await expect(page.getByText("先生設定").first()).toBeVisible()
  await page.goBack()
})
