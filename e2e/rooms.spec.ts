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
  await page.goto(`${TEST_BASE_URL}/data/rooms`, {
    waitUntil: "domcontentloaded",
  })
  await page.waitForTimeout(1000)
})

test.afterAll(async () => {
  await closeApp(ctx)
})

test("特別教室設定ページが表示される", async () => {
  await expect(page.getByText("特別教室設定").first()).toBeVisible()
  await expect(page.getByText("特別教室がありません")).toBeVisible()
})

test("特別教室を追加できる", async () => {
  await page.getByRole("button", { name: "教室を追加" }).click()

  await expect(
    page.getByRole("heading", { name: "特別教室を追加" })
  ).toBeVisible()

  await page.getByPlaceholder("例: 音楽室", { exact: true }).fill("音楽室")
  await page.getByPlaceholder("例: 音", { exact: true }).fill("音")

  await page.getByRole("dialog").getByRole("button", { name: "追加" }).click()
  await expect(page.getByText("特別教室を追加しました")).toBeVisible()
  await expect(page.getByText("音楽室")).toBeVisible()
})

test("教室の基本情報を編集できる", async () => {
  // Detail panel input (first match = detail, second = dialog)
  const nameInput = page
    .getByText("教室名", { exact: true })
    .first()
    .locator("xpath=..")
    .locator("input")
  await nameInput.fill("第1音楽室")
  await nameInput.blur()

  await page.waitForTimeout(500)

  await page.goto(`${TEST_BASE_URL}/data/rooms`, {
    waitUntil: "domcontentloaded",
  })
  await page.waitForTimeout(1000)
  await page.getByText("第1音楽室").click()

  const updatedInput = page
    .getByText("教室名", { exact: true })
    .first()
    .locator("xpath=..")
    .locator("input")
  await expect(updatedInput).toHaveValue("第1音楽室")
})

test("使用可能時間タブが表示される", async () => {
  await page.getByRole("tab", { name: "都合" }).click()
  await expect(page.getByText("使用可能時間", { exact: true })).toBeVisible()
})

test("2つ目の教室を追加できる", async () => {
  await page.getByRole("tab", { name: "基本情報" }).click()
  await page.getByRole("button", { name: "教室を追加" }).click()
  await page.getByPlaceholder("例: 音楽室", { exact: true }).fill("理科室")
  await page.getByPlaceholder("例: 音", { exact: true }).fill("理")
  await page.getByRole("dialog").getByRole("button", { name: "追加" }).click()
  await expect(page.getByText("特別教室を追加しました")).toBeVisible()
  await expect(page.getByText("理科室")).toBeVisible()
})
