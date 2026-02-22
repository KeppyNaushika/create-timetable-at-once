import { test } from "@playwright/test"
import type { Page } from "@playwright/test"

import {
  type AppContext,
  closeApp,
  expect,
  launchApp,
  TEST_BASE_URL,
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

test("自動作成ページが表示される", async () => {
  await page.goto(`${TEST_BASE_URL}/scheduler/auto`)
  await expect(page.locator("h1")).toHaveText("自動時間割作成")
})

test("ソルバー設定パネルが表示される", async () => {
  await expect(page.getByText("ソルバー設定")).toBeVisible()
  await expect(page.getByText("タイムアウト")).toBeVisible()
  await expect(page.getByText("生成パターン数")).toBeVisible()
})

test("自動作成開始ボタンが表示される", async () => {
  await expect(page.getByText("自動作成開始")).toBeVisible()
})
