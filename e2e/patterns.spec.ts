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

test("パターン比較ページが表示される", async () => {
  await page.goto(`${TEST_BASE_URL}/scheduler/patterns`)
  await expect(page.locator("h1")).toHaveText("パターン比較")
})

test("パターンがない場合のメッセージが表示される", async () => {
  await expect(page.getByText("パターンがありません")).toBeVisible()
})
