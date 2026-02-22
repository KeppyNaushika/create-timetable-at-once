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
  await page.goto(`${TEST_BASE_URL}/setup/subjects`, {
    waitUntil: "domcontentloaded",
  })
  // Wait for IPC data to load
  await page.waitForTimeout(2000)
})

test.afterAll(async () => {
  await closeApp(ctx)
})

test("科目設定ページが表示される", async () => {
  await expect(page.getByText("科目設定").first()).toBeVisible()
  await expect(page.getByRole("tab", { name: "一般教科" })).toBeVisible()
})

test("デフォルト科目が表示される", async () => {
  // Note: table cell text includes Badge "既定" (e.g. "国語既定"), so exact match won't work
  const table = page.locator("table").first()
  await expect(table.getByText("国語").first()).toBeVisible({ timeout: 15_000 })
  await expect(table.getByText("数学").first()).toBeVisible()
  await expect(table.getByText("英語").first()).toBeVisible()
})

test("科目を追加できる", async () => {
  await page.getByRole("button", { name: "追加" }).first().click()

  await expect(page.getByText("科目を追加")).toBeVisible()

  await page.getByPlaceholder("例: 国語").fill("プログラミング")
  await page.getByPlaceholder("例: 国", { exact: true }).fill("プ")

  await page.getByRole("dialog").getByRole("button", { name: "保存" }).click()
  await expect(page.getByText("科目を追加しました")).toBeVisible()
  await expect(page.getByText("プログラミング")).toBeVisible()
})

test("科目を編集できる", async () => {
  const row = page.locator("tr").filter({ hasText: "プログラミング" })
  await row.locator("button").first().click()

  await expect(page.getByText("科目を編集")).toBeVisible()

  const nameInput = page.getByPlaceholder("例: 国語")
  await nameInput.fill("情報")

  await page.getByRole("dialog").getByRole("button", { name: "保存" }).click()
  await expect(page.getByText("科目を更新しました")).toBeVisible()
  await expect(page.getByText("情報")).toBeVisible()
})

test("追加した科目を削除できる", async () => {
  const row = page.locator("tr").filter({ hasText: "情報" })
  await row.locator("button").last().click()

  await expect(page.getByText("科目を削除しました")).toBeVisible()
})

test("タブを切り替えられる", async () => {
  await page.getByRole("tab", { name: "予備（学活・道徳・総合等）" }).click()
  await expect(page.getByText("道徳").first()).toBeVisible()

  await page.getByRole("tab", { name: "校務" }).click()
  await page.getByRole("tab", { name: "一般教科" }).click()
})
