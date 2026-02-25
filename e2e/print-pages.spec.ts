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

const printPages = [
  { path: "/print/teacher-all", title: "先生全体表" },
  { path: "/print/class-all", title: "クラス全体表" },
  { path: "/print/teacher-schedule", title: "先生用時間割" },
  { path: "/print/class-schedule", title: "クラス用時間割" },
  { path: "/print/room-schedule", title: "特別教室用時間割" },
  { path: "/print/duty-list", title: "校務一覧表" },
  { path: "/print/teacher-list", title: "先生一覧表" },
  { path: "/print/koma-list", title: "駒一覧" },
  { path: "/print/remaining-koma", title: "残り駒一覧" },
]

for (const { path, title } of printPages) {
  test(`${title}ページが表示される`, async () => {
    await page.goto(`${TEST_BASE_URL}${path}`)
    await expect(page.locator("h1")).toHaveText(title)
  })
}

test("印刷設定パネルが存在する", async () => {
  await page.goto(`${TEST_BASE_URL}/print/teacher-all`)
  await expect(page.getByText("印刷設定")).toBeVisible()
  await expect(page.getByText("用紙サイズ")).toBeVisible()
})

test("PDF・Excel・印刷ボタンが存在する", async () => {
  await expect(page.getByRole("button", { name: "PDF" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Excel" })).toBeVisible()
  await expect(page.getByRole("button", { name: "印刷" })).toBeVisible()
})
