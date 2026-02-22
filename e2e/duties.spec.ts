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

  // 校務テストには先生が必要なので先に追加
  await page.goto(`${TEST_BASE_URL}/data/teachers`, {
    waitUntil: "domcontentloaded",
  })
  await page.waitForTimeout(1000)
  await page.getByRole("button", { name: "先生を追加" }).click()
  await page.getByPlaceholder("例: 山田太郎").fill("田中太郎")
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "追加" })
    .click()
  await expect(page.getByText("先生を追加しました")).toBeVisible()

  await page.goto(`${TEST_BASE_URL}/data/duties`, {
    waitUntil: "domcontentloaded",
  })
  await page.waitForTimeout(1000)
})

test.afterAll(async () => {
  await closeApp(ctx)
})

test("校務設定ページが表示される", async () => {
  await expect(page.getByText("校務設定").first()).toBeVisible()
  await expect(page.getByText("校務がありません")).toBeVisible()
})

test("校務を追加できる", async () => {
  await page.getByRole("button", { name: "校務を追加" }).click()

  await expect(page.getByRole("heading", { name: "校務を追加" })).toBeVisible()

  await page
    .getByPlaceholder("例: 給食指導", { exact: true })
    .fill("給食指導")
  await page.getByPlaceholder("例: 給", { exact: true }).fill("給")

  await page
    .getByRole("dialog")
    .getByRole("button", { name: "追加" })
    .click()
  await expect(page.getByText("校務を追加しました")).toBeVisible()
  await expect(page.getByText("給食指導")).toBeVisible()
})

test("校務の基本情報を編集できる", async () => {
  // Detail panel input (first match = detail, second = dialog)
  const nameInput = page
    .getByText("校務名", { exact: true })
    .first()
    .locator("xpath=..")
    .locator("input")
  await nameInput.fill("昼食指導")
  await nameInput.blur()

  await page.waitForTimeout(500)

  await page.goto(`${TEST_BASE_URL}/data/duties`, {
    waitUntil: "domcontentloaded",
  })
  await page.waitForTimeout(1000)
  await page.getByText("昼食指導").click()

  const updatedInput = page
    .getByText("校務名", { exact: true })
    .first()
    .locator("xpath=..")
    .locator("input")
  await expect(updatedInput).toHaveValue("昼食指導")
})

test("担当先生タブが表示される", async () => {
  await page.getByRole("tab", { name: "担当先生" }).click()
  await expect(page.getByText("田中太郎")).toBeVisible()
})

test("担当先生を割り当てられる", async () => {
  const checkbox = page.locator('[id^="teacher-"]').first()
  await checkbox.click()
  await page.waitForTimeout(500)

  await page.goto(`${TEST_BASE_URL}/data/duties`, {
    waitUntil: "domcontentloaded",
  })
  await page.waitForTimeout(1000)
  await page.getByText("昼食指導").click()
  await page.getByRole("tab", { name: "担当先生" }).click()

  const checkboxAfterReload = page.locator('[id^="teacher-"]').first()
  await expect(checkboxAfterReload).toBeChecked()
})
