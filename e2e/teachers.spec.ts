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
  await page.goto(`${TEST_BASE_URL}/data/teachers`, {
    waitUntil: "domcontentloaded",
  })
  await page.waitForTimeout(1000)
})

test.afterAll(async () => {
  await closeApp(ctx)
})

test("先生設定ページが表示される", async () => {
  await expect(page.getByText("先生設定").first()).toBeVisible()
  await expect(page.getByText("先生がいません")).toBeVisible()
})

test("先生を追加できる", async () => {
  await page.getByRole("button", { name: "先生を追加" }).click()

  await expect(page.getByRole("heading", { name: "先生を追加" })).toBeVisible()

  await page.getByPlaceholder("例: 山田太郎").fill("山田太郎")
  await page.getByPlaceholder("例: やまだたろう").fill("やまだたろう")

  await page.getByRole("dialog").getByRole("button", { name: "追加" }).click()
  await expect(page.getByText("先生を追加しました")).toBeVisible()
  await expect(page.getByText("山田太郎")).toBeVisible()
})

test("先生名を編集（onBlur で保存）できる", async () => {
  // Detail panel's name input
  const nameInput = page
    .getByText("先生名", { exact: true })
    .first()
    .locator("xpath=..")
    .locator("input")
  await nameInput.fill("山田花子")
  await nameInput.blur()

  await page.waitForTimeout(500)

  await page.goto(`${TEST_BASE_URL}/data/teachers`, {
    waitUntil: "domcontentloaded",
  })
  await page.waitForTimeout(1000)
  await page.getByText("山田花子").click()

  const updatedInput = page
    .getByText("先生名", { exact: true })
    .first()
    .locator("xpath=..")
    .locator("input")
  await expect(updatedInput).toHaveValue("山田花子")
})

test("都合タブが表示される", async () => {
  await page.getByRole("tab", { name: "都合" }).click()
  await expect(page.getByText("都合マトリクス")).toBeVisible()
})

test("持ち駒タブが表示される", async () => {
  await page.getByRole("tab", { name: "持ち駒" }).click()
  await expect(
    page.locator('[role="tabpanel"]').getByText("持ち駒")
  ).toBeVisible()
})

test("2人目の先生を追加できる", async () => {
  await page.getByRole("button", { name: "先生を追加" }).click()
  await page.getByPlaceholder("例: 山田太郎").fill("鈴木一郎")
  await page.getByRole("dialog").getByRole("button", { name: "追加" }).click()
  await expect(page.getByText("先生を追加しました")).toBeVisible()
  await expect(page.getByText("鈴木一郎")).toBeVisible()
})

test("先生を選択して切り替えられる", async () => {
  await page.getByText("山田花子").click()
  // Ensure the "基本情報" tab is active
  await page.getByRole("tab", { name: "基本情報" }).click()
  const nameInput = page
    .getByText("先生名", { exact: true })
    .first()
    .locator("xpath=..")
    .locator("input")
  await expect(nameInput).toHaveValue("山田花子")
})
