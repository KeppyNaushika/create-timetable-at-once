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
  await page.goto(`${TEST_BASE_URL}/setup/school`, {
    waitUntil: "domcontentloaded",
  })
})

test.afterAll(async () => {
  await closeApp(ctx)
})

test("学校基本設定ページが表示される", async () => {
  await expect(page.getByText("学校基本設定").first()).toBeVisible()
  await expect(
    page.getByText("基本情報", { exact: true }).first()
  ).toBeVisible()
  await expect(
    page.getByText("学級構成", { exact: true }).first()
  ).toBeVisible()
})

test("学校名を入力・保存できる", async () => {
  const nameInput = page.locator("#schoolName")
  await nameInput.fill("テスト中学校")
  await expect(nameInput).toHaveValue("テスト中学校")

  await page.getByRole("button", { name: "保存" }).click()
  await expect(page.getByText("学校基本設定を保存しました")).toBeVisible()
})

test("年度を変更できる", async () => {
  const yearInput = page.locator("#academicYear")
  await yearInput.fill("2026")
  await expect(yearInput).toHaveValue("2026")
})

test("学級数を設定できる", async () => {
  const gradeInputs = page.locator('input[type="number"][min="1"][max="20"]')
  await expect(gradeInputs).toHaveCount(3)

  await gradeInputs.nth(0).fill("3")
  await expect(gradeInputs.nth(0)).toHaveValue("3")
})

test("保存後にリロードしても値が保持される", async () => {
  await page.getByRole("button", { name: "保存" }).click()
  await expect(page.getByText("学校基本設定を保存しました")).toBeVisible()

  await page.goto(`${TEST_BASE_URL}/setup/school`, {
    waitUntil: "domcontentloaded",
  })

  const nameInput = page.locator("#schoolName")
  await expect(nameInput).toHaveValue("テスト中学校")
})
