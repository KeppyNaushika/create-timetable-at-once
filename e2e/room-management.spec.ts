/**
 * 特別教室 + 空き設定 E2Eテスト
 *
 * roomCreate, roomUpdate, roomDelete
 * roomAvailabilityBatchUpsert, roomGetWithAvailabilities
 */
import type { Page } from "@playwright/test"
import { test } from "@playwright/test"

import {
  type AppContext,
  closeApp,
  expect,
  launchApp,
} from "./helpers/fixtures"

test.describe.serial("特別教室 + 空き設定", () => {
  let ctx: AppContext
  let page: Page
  const roomIds: string[] = []

  test.beforeAll(async () => {
    ctx = await launchApp()
    page = ctx.page

    await page.evaluate(async () => {
      await window.electronAPI.schoolCreate({
        name: "教室テスト校",
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
        classCountsJson: JSON.stringify({ "1": 2 }),
      })
    })
  })

  test.afterAll(async () => {
    await closeApp(ctx)
  })

  test("roomCreate×4 で複数教室を作成できる", async () => {
    const roomDefs = [
      { name: "音楽室", shortName: "音", capacity: 40 },
      { name: "理科室", shortName: "理", capacity: 40 },
      { name: "体育館", shortName: "体", capacity: 200 },
      { name: "技術室", shortName: "技", capacity: 35 },
    ]
    for (const rd of roomDefs) {
      const room = await page.evaluate(
        async (data) => window.electronAPI.roomCreate(data),
        rd
      )
      expect(room.name).toBe(rd.name)
      expect(room.shortName).toBe(rd.shortName)
      expect(room.capacity).toBe(rd.capacity)
      roomIds.push(room.id)
    }
    expect(roomIds).toHaveLength(4)
  })

  test("roomAvailabilityBatchUpsert で空き設定を登録できる", async () => {
    // 音楽室: 月曜6限=unavailable, 金曜5-6限=unavailable
    const items = [
      { roomId: roomIds[0], dayOfWeek: 1, period: 6, status: "unavailable" },
      { roomId: roomIds[0], dayOfWeek: 5, period: 5, status: "unavailable" },
      { roomId: roomIds[0], dayOfWeek: 5, period: 6, status: "unavailable" },
    ]
    const results = await page.evaluate(
      async (data) => window.electronAPI.roomAvailabilityBatchUpsert(data),
      items
    )
    expect(results).toHaveLength(3)
  })

  test("roomGetWithAvailabilities で永続化を確認", async () => {
    const room = await page.evaluate(
      async (id) => window.electronAPI.roomGetWithAvailabilities(id),
      roomIds[0]
    )
    expect(room).toBeTruthy()
    expect(room!.name).toBe("音楽室")

    const avails = await page.evaluate(
      async (id) => window.electronAPI.roomAvailabilityGetByRoomId(id),
      roomIds[0]
    )
    expect(avails.length).toBeGreaterThanOrEqual(3)

    const friday5 = avails.find((a) => a.dayOfWeek === 5 && a.period === 5)
    expect(friday5).toBeTruthy()
    expect(friday5!.status).toBe("unavailable")
  })

  test("roomUpdate で教室情報を変更できる", async () => {
    const updated = await page.evaluate(
      async (args) => window.electronAPI.roomUpdate(args.id, args.data),
      { id: roomIds[2], data: { name: "第1体育館", capacity: 300 } }
    )
    expect(updated.name).toBe("第1体育館")
    expect(updated.capacity).toBe(300)
  })

  test("roomDelete で教室を削除できる", async () => {
    await page.evaluate(
      async (id) => window.electronAPI.roomDelete(id),
      roomIds[3] // 技術室を削除
    )

    const rooms = await page.evaluate(() => window.electronAPI.roomGetAll())
    expect(rooms).toHaveLength(3)
    expect(rooms.find((r) => r.id === roomIds[3])).toBeUndefined()
  })
})
