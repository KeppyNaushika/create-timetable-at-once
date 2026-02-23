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

test("個別表ページが表示される", async () => {
  await page.goto(`${TEST_BASE_URL}/review/individual`)
  const hasTitle = await page
    .locator("h1")
    .filter({ hasText: "個別表" })
    .isVisible()
    .catch(() => false)
  const hasEmptyState = await page
    .getByText("採用済みの時間割パターンがありません")
    .isVisible()
    .catch(() => false)
  expect(hasTitle || hasEmptyState).toBe(true)
})

test("個別表ページにナビゲーションからアクセスできる", async () => {
  await expect(
    page.getByRole("link", { name: "個別表" })
  ).toBeVisible()
})
