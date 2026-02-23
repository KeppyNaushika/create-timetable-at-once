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

test("全体表ページが表示される", async () => {
  await page.goto(`${TEST_BASE_URL}/review/overview`)
  // 採用パターンがない場合は空状態メッセージ、ある場合はh1が表示される
  const hasTitle = await page
    .locator("h1")
    .filter({ hasText: "全体表" })
    .isVisible()
    .catch(() => false)
  const hasEmptyState = await page
    .getByText("採用済みの時間割パターンがありません")
    .isVisible()
    .catch(() => false)
  expect(hasTitle || hasEmptyState).toBe(true)
})

test("ナビゲーションに全体表リンクがある", async () => {
  await expect(
    page.getByRole("link", { name: "全体表", exact: true })
  ).toBeVisible()
})

test("ナビゲーションに個別表リンクがある", async () => {
  await expect(
    page.getByRole("link", { name: "個別表", exact: true })
  ).toBeVisible()
})

test("ナビゲーションに品質診断リンクがある", async () => {
  await expect(
    page.getByRole("link", { name: "品質診断", exact: true })
  ).toBeVisible()
})
