/**
 * 校務管理 + 担当割当 E2Eテスト
 *
 * dutyCreate, dutySetTeachers, dutyUpdate, dutyDelete
 */
import { test } from "@playwright/test"
import type { Page } from "@playwright/test"

import {
  type AppContext,
  closeApp,
  expect,
  launchApp,
} from "./helpers/fixtures"
import { createTestSubjects } from "./helpers/school-builder"

test.describe.serial("校務管理 + 担当割当", () => {
  let ctx: AppContext
  let page: Page
  const teacherIds: string[] = []
  const dutyIds: string[] = []

  test.beforeAll(async () => {
    ctx = await launchApp()
    page = ctx.page

    // 前提: 学校 + 教科 + 教員3名
    await page.evaluate(async () => {
      await window.electronAPI.schoolCreate({
        name: "校務テスト校",
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
    const subjectMap = await createTestSubjects(page)

    const data = [
      { name: "教員A", nameKana: "", mainSubjectId: subjectMap["国語"], maxPeriodsPerWeek: 25, maxPerDay: 6, maxConsecutive: 4 },
      { name: "教員B", nameKana: "", mainSubjectId: subjectMap["数学"], maxPeriodsPerWeek: 25, maxPerDay: 6, maxConsecutive: 4 },
      { name: "教員C", nameKana: "", mainSubjectId: subjectMap["英語"], maxPeriodsPerWeek: 25, maxPerDay: 6, maxConsecutive: 4 },
    ]
    const teachers = await page.evaluate(
      async (d) => window.electronAPI.teacherBatchImport(d),
      data
    )
    for (const t of teachers) teacherIds.push(t.id)
  })

  test.afterAll(async () => {
    await closeApp(ctx)
  })

  test("dutyCreate で校務を作成できる", async () => {
    const duty1 = await page.evaluate(async () => {
      return await window.electronAPI.dutyCreate({
        name: "給食指導",
        dayOfWeek: 2,
        period: 5,
      })
    })
    expect(duty1.name).toBe("給食指導")
    expect(duty1.dayOfWeek).toBe(2)
    expect(duty1.period).toBe(5)
    dutyIds.push(duty1.id)

    const duty2 = await page.evaluate(async () => {
      return await window.electronAPI.dutyCreate({
        name: "生徒指導",
        dayOfWeek: 4,
        period: 6,
      })
    })
    dutyIds.push(duty2.id)
  })

  test("dutySetTeachers で担当教員を割当できる", async () => {
    // 給食指導 → 教員A, 教員B
    await page.evaluate(
      async (args) =>
        window.electronAPI.dutySetTeachers(args.dutyId, args.teacherIds),
      { dutyId: dutyIds[0], teacherIds: [teacherIds[0], teacherIds[1]] }
    )

    // 生徒指導 → 教員C
    await page.evaluate(
      async (args) =>
        window.electronAPI.dutySetTeachers(args.dutyId, args.teacherIds),
      { dutyId: dutyIds[1], teacherIds: [teacherIds[2]] }
    )

    // 割当確認
    const duties = await page.evaluate(() => window.electronAPI.dutyGetAll())
    expect(duties).toHaveLength(2)

    const duty1 = duties.find((d) => d.id === dutyIds[0])
    expect(duty1).toBeTruthy()
    expect(duty1!.teacherDuties?.length).toBe(2)
  })

  test("dutyUpdate で校務名を変更できる", async () => {
    const updated = await page.evaluate(
      async (args) => window.electronAPI.dutyUpdate(args.id, args.data),
      { id: dutyIds[0], data: { name: "昼食指導" } }
    )
    expect(updated.name).toBe("昼食指導")
  })

  test("dutyDelete で校務を削除できる", async () => {
    await page.evaluate(
      async (id) => window.electronAPI.dutyDelete(id),
      dutyIds[1]
    )

    const duties = await page.evaluate(() => window.electronAPI.dutyGetAll())
    expect(duties).toHaveLength(1)
    expect(duties.find((d) => d.id === dutyIds[1])).toBeUndefined()
  })
})
