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

test("駒チェックページが表示される", async () => {
  await page.goto(`${TEST_BASE_URL}/scheduler/check`)
  await expect(page.locator("h1")).toHaveText("駒チェック")
})

test("タブが表示される", async () => {
  await expect(page.getByText("先生容量チェック")).toBeVisible()
  await expect(page.getByText("時限サマリ")).toBeVisible()
})

test("先生容量チェックタブが初期表示", async () => {
  await expect(page.getByText("先生容量一覧")).toBeVisible()
})

test("時限サマリタブに切り替えられる", async () => {
  await page.getByText("時限サマリ").click()
  await expect(page.getByText("曜日×時限サマリ")).toBeVisible()
})
