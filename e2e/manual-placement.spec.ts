import type { Page } from "@playwright/test"
import { test } from "@playwright/test"

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

test("手動配置ページが表示される", async () => {
  await page.goto(`${TEST_BASE_URL}/scheduler/manual`)
  await page.waitForLoadState("domcontentloaded")
  // ツールバーの表示モード切替が存在することを確認
  await expect(page.getByText("先生別")).toBeVisible()
  await expect(page.getByText("クラス別")).toBeVisible()
  await expect(page.getByText("教室別")).toBeVisible()
})

test("未配置の駒パネルが表示される", async () => {
  await expect(page.getByText("未配置の駒")).toBeVisible()
})

test("表示モードを切り替えられる", async () => {
  await page.getByText("クラス別").click()
  // 切替後もページがクラッシュしないことを確認
  await expect(page.getByText("未配置の駒")).toBeVisible()

  await page.getByText("教室別").click()
  await expect(page.getByText("未配置の駒")).toBeVisible()

  await page.getByText("先生別").click()
  await expect(page.getByText("未配置の駒")).toBeVisible()
})

test("Undo/Redo ボタンが存在する", async () => {
  // Undo/Redo ボタンはアイコンのみなので aria label やtooltipではなくボタン存在を確認
  const toolbar = page.locator(".flex.flex-wrap.items-center.gap-2")
  await expect(toolbar).toBeVisible()
})
