/**
 * 学年・クラス CRUD E2Eテスト
 *
 * gradeCreate, classBatchCreate, classUpdate, classDelete
 * classGetByGradeId
 */
import type { Page } from "@playwright/test"
import { test } from "@playwright/test"

import {
  type AppContext,
  closeApp,
  expect,
  launchApp,
} from "./helpers/fixtures"

test.describe.serial("学年・クラス CRUD", () => {
  let ctx: AppContext
  let page: Page
  const gradeIds: string[] = []
  const classIds: string[][] = []

  test.beforeAll(async () => {
    ctx = await launchApp()
    page = ctx.page

    // 前提: 学校作成
    await page.evaluate(async () => {
      await window.electronAPI.schoolCreate({
        name: "クラステスト校",
        academicYear: 2026,
        daysPerWeek: 5,
        maxPeriodsPerDay: 6,
        hasZeroPeriod: false,
        namingConvention: "number",
        periodNamesJson: JSON.stringify([
          "1限",
          "2限",
          "3限",
          "4限",
          "5限",
          "6限",
        ]),
        periodLengthsJson: JSON.stringify([50, 50, 50, 50, 50, 50]),
        lunchAfterPeriod: 4,
        classCountsJson: JSON.stringify({ "1": 3, "2": 3, "3": 3 }),
      })
    })
  })

  test.afterAll(async () => {
    await closeApp(ctx)
  })

  test("gradeCreate×3 + classBatchCreate で学年×クラス構造を作成", async () => {
    for (let g = 1; g <= 3; g++) {
      const grade = await page.evaluate(
        async (args) => window.electronAPI.gradeCreate(args),
        { gradeNum: g, name: `${g}年` }
      )
      gradeIds.push(grade.id)

      const classInputs = Array.from({ length: 3 }, (_, i) => ({
        gradeId: grade.id,
        name: `${i + 1}組`,
        sortOrder: i + 1,
      }))
      const classes = await page.evaluate(
        async (args) => window.electronAPI.classBatchCreate(args),
        classInputs
      )
      classIds.push(classes.map((c) => c.id))
    }

    expect(gradeIds).toHaveLength(3)
    expect(classIds.flat()).toHaveLength(9)
  })

  test("classGetByGradeId で学年別フィルタリングできる", async () => {
    const classes1 = await page.evaluate(
      async (id) => window.electronAPI.classGetByGradeId(id),
      gradeIds[0]
    )
    expect(classes1).toHaveLength(3)
    for (const c of classes1) {
      expect(c.gradeId).toBe(gradeIds[0])
    }

    const classes2 = await page.evaluate(
      async (id) => window.electronAPI.classGetByGradeId(id),
      gradeIds[1]
    )
    expect(classes2).toHaveLength(3)
  })

  test("classUpdate でクラス名を変更できる", async () => {
    const targetId = classIds[0][0]
    const updated = await page.evaluate(
      async (args) => window.electronAPI.classUpdate(args.id, args.data),
      { id: targetId, data: { name: "A組" } }
    )
    expect(updated.name).toBe("A組")

    // 永続化確認
    const classes = await page.evaluate(
      async (id) => window.electronAPI.classGetByGradeId(id),
      gradeIds[0]
    )
    const found = classes.find((c) => c.id === targetId)
    expect(found).toBeTruthy()
    expect(found!.name).toBe("A組")
  })

  test("classDelete でクラスを削除できる", async () => {
    const targetId = classIds[0][2] // 1年3組を削除
    await page.evaluate(
      async (id) => window.electronAPI.classDelete(id),
      targetId
    )

    const classes = await page.evaluate(
      async (id) => window.electronAPI.classGetByGradeId(id),
      gradeIds[0]
    )
    expect(classes).toHaveLength(2)
    expect(classes.find((c) => c.id === targetId)).toBeUndefined()
  })

  test("gradeDelete でカスケード削除される", async () => {
    // 2年を削除
    await page.evaluate(
      async (id) => window.electronAPI.gradeDelete(id),
      gradeIds[1]
    )

    const grades = await page.evaluate(() => window.electronAPI.gradeGetAll())
    expect(grades).toHaveLength(2)

    // 2年のクラスも全て消えている
    const allClasses = await page.evaluate(() =>
      window.electronAPI.classGetAll()
    )
    const grade2Classes = allClasses.filter((c) => c.gradeId === gradeIds[1])
    expect(grade2Classes).toHaveLength(0)
  })
})
