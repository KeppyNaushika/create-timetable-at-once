/**
 * 教科管理 CRUD E2Eテスト
 *
 * subjectSeedDefaults, subjectCreate, subjectUpdate, subjectDelete
 * subjectGetByCategory
 */
import { test } from "@playwright/test"
import type { Page } from "@playwright/test"

import {
  type AppContext,
  closeApp,
  expect,
  launchApp,
} from "./helpers/fixtures"

test.describe.serial("教科管理 CRUD", () => {
  let ctx: AppContext
  let page: Page
  let customSubjectId: string

  test.beforeAll(async () => {
    ctx = await launchApp()
    page = ctx.page

    // 学校作成（教科シードの前提）
    await page.evaluate(async () => {
      await window.electronAPI.schoolCreate({
        name: "教科テスト校",
        academicYear: 2026,
        daysPerWeek: 5,
        maxPeriodsPerDay: 6,
        hasZeroPeriod: false,
        namingConvention: "number",
        periodNamesJson: JSON.stringify(["1限", "2限", "3限", "4限", "5限", "6限"]),
        periodLengthsJson: JSON.stringify([50, 50, 50, 50, 50, 50]),
        lunchAfterPeriod: 4,
        classCountsJson: JSON.stringify({ "1": 2 }),
      })
    })
  })

  test.afterAll(async () => {
    await closeApp(ctx)
  })

  test("subjectSeedDefaults で14教科以上が生成される", async () => {
    await page.evaluate(async () => {
      await window.electronAPI.subjectSeedDefaults()
    })
    const subjects = await page.evaluate(() =>
      window.electronAPI.subjectGetAll()
    )
    expect(subjects.length).toBeGreaterThanOrEqual(14)

    // 主要教科の存在確認
    const names = subjects.map((s) => s.name)
    for (const name of ["国語", "社会", "数学", "理科", "英語", "音楽", "保健体育"]) {
      expect(names).toContain(name)
    }
  })

  test("subjectCreate でカスタム教科を追加できる", async () => {
    const subject = await page.evaluate(async () => {
      return await window.electronAPI.subjectCreate({
        name: "プログラミング",
        shortName: "プ",
        category: "general",
        color: "#FF6600",
      })
    })
    expect(subject.name).toBe("プログラミング")
    expect(subject.shortName).toBe("プ")
    customSubjectId = subject.id
  })

  test("subjectUpdate で教科名を変更できる", async () => {
    const updated = await page.evaluate(
      async (args) => {
        return await window.electronAPI.subjectUpdate(args.id, args.data)
      },
      { id: customSubjectId, data: { name: "情報" } }
    )
    expect(updated.name).toBe("情報")
  })

  test("subjectGetByCategory でカテゴリフィルタリングできる", async () => {
    const generals = await page.evaluate(() =>
      window.electronAPI.subjectGetByCategory("general")
    )
    expect(generals.length).toBeGreaterThan(0)
    for (const s of generals) {
      expect(s.category).toBe("general")
    }
  })

  test("subjectDelete で教科を削除できる", async () => {
    const before = await page.evaluate(() =>
      window.electronAPI.subjectGetAll()
    )
    const countBefore = before.length

    await page.evaluate(
      async (id) => window.electronAPI.subjectDelete(id),
      customSubjectId
    )

    const after = await page.evaluate(() =>
      window.electronAPI.subjectGetAll()
    )
    expect(after.length).toBe(countBefore - 1)
    expect(after.find((s) => s.id === customSubjectId)).toBeUndefined()
  })
})
