/**
 * 駒 CRUD + 紐付け E2Eテスト
 *
 * komaCreate, komaSetTeachers, komaSetClasses, komaSetRooms
 * komaUpdate, komaDuplicate, komaDelete, komaBatchCreate
 * komaGetByGradeId, komaGetByTeacherId
 */
import { test } from "@playwright/test"
import type { Page } from "@playwright/test"

import {
  type AppContext,
  closeApp,
  expect,
  launchApp,
} from "./helpers/fixtures"
import {
  createTestSchool,
  createTestSubjects,
  createTestTeachers,
  createTestRooms,
  type SchoolIds,
} from "./helpers/school-builder"

test.describe.serial("駒 CRUD + 紐付け", () => {
  let ctx: AppContext
  let page: Page
  let schoolIds: SchoolIds
  let teacherIds: string[]
  let roomIds: string[]
  let komaId: string

  test.beforeAll(async () => {
    ctx = await launchApp()
    page = ctx.page

    // 前提データ作成
    schoolIds = await createTestSchool(page, {
      name: "駒テスト校",
      gradeClassCounts: { 1: 2, 2: 2 },
    })
    schoolIds.subjectMap = await createTestSubjects(page)

    teacherIds = await createTestTeachers(
      page,
      [
        { name: "先生A", mainSubject: "国語" },
        { name: "先生B", mainSubject: "数学" },
        { name: "先生C", mainSubject: "理科" },
      ],
      schoolIds.subjectMap
    )

    roomIds = await createTestRooms(page, [
      { name: "理科室", shortName: "理" },
    ])
  })

  test.afterAll(async () => {
    await closeApp(ctx)
  })

  test("komaCreate で駒を作成できる", async () => {
    const koma = await page.evaluate(
      async (data) => window.electronAPI.komaCreate(data),
      {
        subjectId: schoolIds.subjectMap["国語"],
        gradeId: schoolIds.gradeIds[0],
        type: "normal",
        count: 4,
        priority: 5,
        label: "",
      }
    )
    expect(koma).toBeTruthy()
    expect(koma.count).toBe(4)
    expect(koma.type).toBe("normal")
    komaId = koma.id
  })

  test("komaSetTeachers で教員を紐付けできる", async () => {
    await page.evaluate(
      async (args) =>
        window.electronAPI.komaSetTeachers(args.komaId, args.teachers),
      { komaId, teachers: [{ teacherId: teacherIds[0], role: "main" }] }
    )

    const koma = await page.evaluate(
      async (id) => window.electronAPI.komaGetById(id),
      komaId
    )
    expect(koma).toBeTruthy()
    expect(koma!.komaTeachers).toHaveLength(1)
    expect(koma!.komaTeachers![0].teacherId).toBe(teacherIds[0])
  })

  test("komaSetClasses でクラスを紐付けできる", async () => {
    await page.evaluate(
      async (args) =>
        window.electronAPI.komaSetClasses(args.komaId, args.classIds),
      { komaId, classIds: [schoolIds.classIds[0][0]] }
    )

    const koma = await page.evaluate(
      async (id) => window.electronAPI.komaGetById(id),
      komaId
    )
    expect(koma!.komaClasses).toHaveLength(1)
  })

  test("komaSetRooms で教室を紐付けできる", async () => {
    await page.evaluate(
      async (args) =>
        window.electronAPI.komaSetRooms(args.komaId, args.roomIds),
      { komaId, roomIds: [roomIds[0]] }
    )

    const koma = await page.evaluate(
      async (id) => window.electronAPI.komaGetById(id),
      komaId
    )
    expect(koma!.komaRooms).toHaveLength(1)
  })

  test("komaUpdate で駒情報を変更できる", async () => {
    const updated = await page.evaluate(
      async (args) => window.electronAPI.komaUpdate(args.id, args.data),
      { id: komaId, data: { count: 3, priority: 8 } }
    )
    expect(updated.count).toBe(3)
    expect(updated.priority).toBe(8)
  })

  test("komaDuplicate で駒を複製できる", async () => {
    const dup = await page.evaluate(
      async (id) => window.electronAPI.komaDuplicate(id),
      komaId
    )
    expect(dup).toBeTruthy()
    expect(dup.id).not.toBe(komaId)
    expect(dup.count).toBe(3) // 複製元と同じ

    // 複製分を削除してクリーン
    await page.evaluate(
      async (id) => window.electronAPI.komaDelete(id),
      dup.id
    )
  })

  test("komaBatchCreate で一括作成できる", async () => {
    const batch = [
      {
        subjectId: schoolIds.subjectMap["数学"],
        gradeId: schoolIds.gradeIds[0],
        type: "normal",
        count: 4,
        priority: 5,
        label: "",
      },
      {
        subjectId: schoolIds.subjectMap["英語"],
        gradeId: schoolIds.gradeIds[0],
        type: "normal",
        count: 4,
        priority: 5,
        label: "",
      },
    ]
    const komas = await page.evaluate(
      async (data) => window.electronAPI.komaBatchCreate(data),
      batch
    )
    expect(komas).toHaveLength(2)
  })

  test("komaGetByGradeId で学年別フィルタリングできる", async () => {
    const komas = await page.evaluate(
      async (id) => window.electronAPI.komaGetByGradeId(id),
      schoolIds.gradeIds[0]
    )
    // komaCreate(1) + komaBatchCreate(2) = 3駒
    expect(komas.length).toBeGreaterThanOrEqual(3)
    for (const k of komas) {
      expect(k.gradeId).toBe(schoolIds.gradeIds[0])
    }
  })

  test("komaGetByTeacherId で教員別フィルタリングできる", async () => {
    const komas = await page.evaluate(
      async (id) => window.electronAPI.komaGetByTeacherId(id),
      teacherIds[0]
    )
    expect(komas.length).toBeGreaterThanOrEqual(1)
  })

  test("komaDelete で駒を削除できる", async () => {
    const before = await page.evaluate(() => window.electronAPI.komaGetAll())
    const countBefore = before.length

    await page.evaluate(
      async (id) => window.electronAPI.komaDelete(id),
      komaId
    )

    const after = await page.evaluate(() => window.electronAPI.komaGetAll())
    expect(after.length).toBe(countBefore - 1)
  })
})
