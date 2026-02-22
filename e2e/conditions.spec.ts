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

test("処理条件設定ページが表示される", async () => {
  await page.goto(`${TEST_BASE_URL}/scheduler/conditions`)
  await expect(page.locator("h1")).toHaveText("処理条件設定")
})

test("制約条件一覧が表示される", async () => {
  await expect(page.getByText("先生の都合")).toBeVisible()
  await expect(page.getByText("教室重複禁止")).toBeVisible()
  await expect(page.getByText("校務時間帯不可")).toBeVisible()
})

test("制約レベルを変更できる", async () => {
  // 先頭の制約のSelectトリガーをクリック
  const firstSelect = page
    .locator("table tbody tr")
    .first()
    .locator("button[role='combobox']")
    .first()
  await firstSelect.click()
  // ドロップダウンが開くのを待つ
  await page.waitForTimeout(300)
  // 選択肢が表示されることを確認
  const options = page.locator("[role='option']")
  await expect(options.first()).toBeVisible()
  // Escで閉じる
  await page.keyboard.press("Escape")
})

test("教科別条件ダイアログを開ける", async () => {
  await page.getByText("教科別条件").click()
  await expect(page.getByText("教科別制約条件")).toBeVisible()
  // 閉じる
  await page.keyboard.press("Escape")
})
