import ExcelJS from "exceljs"

const DAY_NAMES = ["月", "火", "水", "木", "金", "土"]

interface ExcelData {
  school: { daysPerWeek: number; maxPeriodsPerDay: number } | null
  teachers: {
    id: string
    name: string
    nameKana: string
    mainSubjectId: string | null
    maxPerDay: number
    maxConsecutive: number
    maxPeriodsPerWeek: number
    notes: string
  }[]
  classes: { id: string; name: string }[]
  subjects: { id: string; name: string; shortName: string; color: string }[]
  rooms: { id: string; name: string; shortName: string }[]
  duties: {
    id: string
    name: string
    shortName: string
    dayOfWeek: number
    period: number
    teacherDuties?: { teacherId: string; teacher?: { name: string } }[]
  }[]
  komas: {
    id: string
    subjectId: string
    gradeId: string
    type: string
    count: number
    label: string
    priority: number
    komaTeachers?: { teacherId: string }[]
    komaClasses?: { classId: string }[]
    komaRooms?: { roomId: string }[]
  }[]
  grades: { id: string; name: string }[]
  slots: { komaId: string; dayOfWeek: number; period: number }[]
}

function colorToArgb(hexColor: string): string {
  return "FF" + hexColor.replace("#", "")
}

function addThinBorders(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  }
}

function createScheduleSheet(
  wb: ExcelJS.Workbook,
  sheetName: string,
  title: string,
  entityName: string,
  entities: { id: string; name: string }[],
  data: ExcelData,
  getEntitySlots: (entityId: string) => ExcelData["slots"]
) {
  const ws = wb.addWorksheet(sheetName)
  const daysPerWeek = data.school?.daysPerWeek ?? 5
  const maxPeriods = data.school?.maxPeriodsPerDay ?? 6
  const komaMap = new Map(data.komas.map((k) => [k.id, k]))
  const subjectMap = new Map(data.subjects.map((s) => [s.id, s]))

  // Title
  ws.mergeCells(1, 1, 1, daysPerWeek + 1)
  const titleCell = ws.getCell(1, 1)
  titleCell.value = title
  titleCell.font = { bold: true, size: 14 }
  titleCell.alignment = { horizontal: "center" }

  // Individual tables per entity
  let startRow = 3
  for (const entity of entities) {
    ws.getCell(startRow, 1).value = `${entity.name} ${entityName}`
    ws.getCell(startRow, 1).font = { bold: true, size: 11 }
    startRow++

    // Header row
    const headerRow = startRow
    ws.getCell(headerRow, 1).value = "時限"
    addThinBorders(ws.getCell(headerRow, 1))
    ws.getCell(headerRow, 1).font = { bold: true }
    ws.getCell(headerRow, 1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF0F0F0" },
    }

    for (let d = 0; d < daysPerWeek; d++) {
      const cell = ws.getCell(headerRow, d + 2)
      cell.value = DAY_NAMES[d]
      cell.font = { bold: true }
      cell.alignment = { horizontal: "center" }
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF0F0F0" },
      }
      addThinBorders(cell)
    }
    startRow++

    const entitySlots = getEntitySlots(entity.id)
    for (let p = 1; p <= maxPeriods; p++) {
      const cell = ws.getCell(startRow, 1)
      cell.value = p
      cell.alignment = { horizontal: "center" }
      addThinBorders(cell)

      for (let d = 0; d < daysPerWeek; d++) {
        const slot = entitySlots.find(
          (s) => s.dayOfWeek === d && s.period === p
        )
        const koma = slot ? komaMap.get(slot.komaId) : null
        const subject = koma ? subjectMap.get(koma.subjectId) : null
        const c = ws.getCell(startRow, d + 2)
        c.value = subject ? subject.shortName || subject.name : ""
        c.alignment = { horizontal: "center" }
        addThinBorders(c)
        if (subject?.color) {
          c.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: colorToArgb(subject.color) + "30" },
          }
        }
      }
      startRow++
    }
    startRow += 2
  }

  // Set column widths
  ws.getColumn(1).width = 8
  for (let d = 0; d < daysPerWeek; d++) {
    ws.getColumn(d + 2).width = 12
  }
}

export async function generateExcel(
  reportType: string,
  data: ExcelData
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  const komaMap = new Map(data.komas.map((k) => [k.id, k]))
  const subjectMap = new Map(data.subjects.map((s) => [s.id, s]))
  const gradeMap = new Map(data.grades.map((g) => [g.id, g]))
  const teacherMap = new Map(data.teachers.map((t) => [t.id, t]))
  const daysPerWeek = data.school?.daysPerWeek ?? 5
  const maxPeriods = data.school?.maxPeriodsPerDay ?? 6

  switch (reportType) {
    case "teacher-all": {
      const ws = wb.addWorksheet("先生全体表")
      ws.getCell(1, 1).value = "先生全体表"
      ws.getCell(1, 1).font = { bold: true, size: 14 }

      // Header
      let col = 2
      for (let d = 0; d < daysPerWeek; d++) {
        for (let p = 1; p <= maxPeriods; p++) {
          const c = ws.getCell(2, col)
          c.value = `${DAY_NAMES[d]}${p}`
          c.font = { bold: true, size: 8 }
          c.alignment = { horizontal: "center" }
          addThinBorders(c)
          col++
        }
      }
      ws.getCell(2, 1).value = "先生"
      ws.getCell(2, 1).font = { bold: true }
      addThinBorders(ws.getCell(2, 1))

      let row = 3
      for (const teacher of data.teachers) {
        ws.getCell(row, 1).value = teacher.name
        addThinBorders(ws.getCell(row, 1))
        col = 2
        for (let d = 0; d < daysPerWeek; d++) {
          for (let p = 1; p <= maxPeriods; p++) {
            const slot = data.slots.find((s) => {
              const k = komaMap.get(s.komaId)
              return (
                s.dayOfWeek === d &&
                s.period === p &&
                k?.komaTeachers?.some((kt) => kt.teacherId === teacher.id)
              )
            })
            const koma = slot ? komaMap.get(slot.komaId) : null
            const subject = koma ? subjectMap.get(koma.subjectId) : null
            const c = ws.getCell(row, col)
            c.value = subject?.shortName ?? ""
            c.alignment = { horizontal: "center" }
            c.font = { size: 8 }
            addThinBorders(c)
            col++
          }
        }
        row++
      }
      ws.getColumn(1).width = 12
      break
    }

    case "class-all": {
      const ws = wb.addWorksheet("クラス全体表")
      ws.getCell(1, 1).value = "クラス全体表"
      ws.getCell(1, 1).font = { bold: true, size: 14 }

      let col = 2
      for (let d = 0; d < daysPerWeek; d++) {
        for (let p = 1; p <= maxPeriods; p++) {
          const c = ws.getCell(2, col)
          c.value = `${DAY_NAMES[d]}${p}`
          c.font = { bold: true, size: 8 }
          c.alignment = { horizontal: "center" }
          addThinBorders(c)
          col++
        }
      }
      ws.getCell(2, 1).value = "クラス"
      ws.getCell(2, 1).font = { bold: true }
      addThinBorders(ws.getCell(2, 1))

      let row = 3
      for (const cls of data.classes) {
        ws.getCell(row, 1).value = cls.name
        addThinBorders(ws.getCell(row, 1))
        col = 2
        for (let d = 0; d < daysPerWeek; d++) {
          for (let p = 1; p <= maxPeriods; p++) {
            const slot = data.slots.find((s) => {
              const k = komaMap.get(s.komaId)
              return (
                s.dayOfWeek === d &&
                s.period === p &&
                k?.komaClasses?.some((kc) => kc.classId === cls.id)
              )
            })
            const koma = slot ? komaMap.get(slot.komaId) : null
            const subject = koma ? subjectMap.get(koma.subjectId) : null
            const c = ws.getCell(row, col)
            c.value = subject?.shortName ?? ""
            c.alignment = { horizontal: "center" }
            c.font = { size: 8 }
            addThinBorders(c)
            col++
          }
        }
        row++
      }
      ws.getColumn(1).width = 12
      break
    }

    case "teacher-schedule":
      createScheduleSheet(
        wb,
        "先生時間割",
        "先生用時間割",
        "時間割",
        data.teachers,
        data,
        (tid) =>
          data.slots.filter((s) => {
            const k = komaMap.get(s.komaId)
            return k?.komaTeachers?.some((kt) => kt.teacherId === tid)
          })
      )
      break

    case "class-schedule":
      createScheduleSheet(
        wb,
        "クラス時間割",
        "クラス用時間割",
        "時間割",
        data.classes,
        data,
        (cid) =>
          data.slots.filter((s) => {
            const k = komaMap.get(s.komaId)
            return k?.komaClasses?.some((kc) => kc.classId === cid)
          })
      )
      break

    case "room-schedule":
      createScheduleSheet(
        wb,
        "教室時間割",
        "特別教室用時間割",
        "利用予定",
        data.rooms,
        data,
        (rid) =>
          data.slots.filter((s) => {
            const k = komaMap.get(s.komaId)
            return k?.komaRooms?.some((kr) => kr.roomId === rid)
          })
      )
      break

    case "duty-list": {
      const ws = wb.addWorksheet("校務一覧")
      const headers = ["校務名", "略称", "曜日", "時限", "担当者"]
      headers.forEach((h, i) => {
        const c = ws.getCell(1, i + 1)
        c.value = h
        c.font = { bold: true }
        addThinBorders(c)
      })
      let row = 2
      for (const duty of data.duties) {
        ws.getCell(row, 1).value = duty.name
        ws.getCell(row, 2).value = duty.shortName
        ws.getCell(row, 3).value = DAY_NAMES[duty.dayOfWeek] ?? ""
        ws.getCell(row, 4).value = duty.period
        ws.getCell(row, 5).value =
          duty.teacherDuties
            ?.map((td) => td.teacher?.name ?? "")
            .filter(Boolean)
            .join(", ") ?? ""
        for (let i = 1; i <= 5; i++) addThinBorders(ws.getCell(row, i))
        row++
      }
      break
    }

    case "teacher-list": {
      const ws = wb.addWorksheet("先生一覧")
      const headers = [
        "氏名",
        "カナ",
        "主担当教科",
        "1日最大",
        "連続最大",
        "週最大",
        "備考",
      ]
      headers.forEach((h, i) => {
        const c = ws.getCell(1, i + 1)
        c.value = h
        c.font = { bold: true }
        addThinBorders(c)
      })
      let row = 2
      for (const teacher of data.teachers) {
        const mainSubject = teacher.mainSubjectId
          ? subjectMap.get(teacher.mainSubjectId)
          : null
        ws.getCell(row, 1).value = teacher.name
        ws.getCell(row, 2).value = teacher.nameKana
        ws.getCell(row, 3).value = mainSubject?.name ?? ""
        ws.getCell(row, 4).value = teacher.maxPerDay
        ws.getCell(row, 5).value = teacher.maxConsecutive
        ws.getCell(row, 6).value = teacher.maxPeriodsPerWeek
        ws.getCell(row, 7).value = teacher.notes ?? ""
        for (let i = 1; i <= 7; i++) addThinBorders(ws.getCell(row, i))
        row++
      }
      break
    }

    case "koma-list": {
      const ws = wb.addWorksheet("駒一覧")
      const headers = [
        "教科",
        "学年",
        "タイプ",
        "コマ数",
        "ラベル",
        "担当先生",
        "優先度",
      ]
      headers.forEach((h, i) => {
        const c = ws.getCell(1, i + 1)
        c.value = h
        c.font = { bold: true }
        addThinBorders(c)
      })
      let row = 2
      for (const koma of data.komas) {
        const subject = subjectMap.get(koma.subjectId)
        const grade = gradeMap.get(koma.gradeId)
        const teachers = koma.komaTeachers
          ?.map((kt) => teacherMap.get(kt.teacherId)?.name ?? "")
          .filter(Boolean)
          .join(", ")
        ws.getCell(row, 1).value = subject?.name ?? ""
        ws.getCell(row, 2).value = grade?.name ?? ""
        ws.getCell(row, 3).value = koma.type === "consecutive" ? "連続" : "普通"
        ws.getCell(row, 4).value = koma.count
        ws.getCell(row, 5).value = koma.label
        ws.getCell(row, 6).value = teachers ?? ""
        ws.getCell(row, 7).value = koma.priority
        for (let i = 1; i <= 7; i++) addThinBorders(ws.getCell(row, i))
        row++
      }
      break
    }

    case "remaining-koma": {
      const ws = wb.addWorksheet("残り駒一覧")
      const placedCount = new Map<string, number>()
      for (const slot of data.slots) {
        placedCount.set(slot.komaId, (placedCount.get(slot.komaId) ?? 0) + 1)
      }
      const headers = [
        "教科",
        "学年",
        "ラベル",
        "必要数",
        "配置済",
        "残り",
        "担当先生",
      ]
      headers.forEach((h, i) => {
        const c = ws.getCell(1, i + 1)
        c.value = h
        c.font = { bold: true }
        addThinBorders(c)
      })
      let row = 2
      for (const koma of data.komas) {
        const placed = placedCount.get(koma.id) ?? 0
        const remaining = koma.count - placed
        if (remaining <= 0) continue
        const subject = subjectMap.get(koma.subjectId)
        const grade = gradeMap.get(koma.gradeId)
        const teachers = koma.komaTeachers
          ?.map((kt) => teacherMap.get(kt.teacherId)?.name ?? "")
          .filter(Boolean)
          .join(", ")
        ws.getCell(row, 1).value = subject?.name ?? ""
        ws.getCell(row, 2).value = grade?.name ?? ""
        ws.getCell(row, 3).value = koma.label
        ws.getCell(row, 4).value = koma.count
        ws.getCell(row, 5).value = placed
        ws.getCell(row, 6).value = remaining
        ws.getCell(row, 7).value = teachers ?? ""
        for (let i = 1; i <= 7; i++) addThinBorders(ws.getCell(row, i))
        row++
      }
      break
    }

    default:
      throw new Error(`未知のレポートタイプ: ${reportType}`)
  }

  const buffer = await wb.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
