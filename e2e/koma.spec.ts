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

  // 駒テストには学年が必要なので先に学校設定を保存
  await page.goto(`${TEST_BASE_URL}/setup/school`, {
    waitUntil: "domcontentloaded",
  })
  await page.locator("#schoolName").fill("テスト中学校")
  await page.getByRole("button", { name: "保存" }).click()
  await expect(page.getByText("学校基本設定を保存しました")).toBeVisible()

  await page.goto(`${TEST_BASE_URL}/data/koma`, {
    waitUntil: "domcontentloaded",
  })
})

test.afterAll(async () => {
  await closeApp(ctx)
})

test("駒設定ページが表示される", async () => {
  await expect(page.getByText("駒設定").first()).toBeVisible()
})

test("学年タブが存在する", async () => {
  await expect(page.getByText("1年").first()).toBeVisible()
  await expect(page.getByText("2年").first()).toBeVisible()
  await expect(page.getByText("3年").first()).toBeVisible()
})

test("一括生成ダイアログを開ける", async () => {
  await page.getByRole("button", { name: "一括生成" }).click()
  await expect(page.getByRole("dialog")).toBeVisible()

  await page.keyboard.press("Escape")
})

test("駒を追加できる", async () => {
  await page.getByRole("button", { name: "駒を追加" }).click()
  await expect(page.getByText("駒を追加しました")).toBeVisible()
})

test("学年タブを切り替えられる", async () => {
  await page.getByText("2年").first().click()
  await page.waitForTimeout(500)

  await page.getByText("1年").first().click()
  await page.waitForTimeout(500)
})
