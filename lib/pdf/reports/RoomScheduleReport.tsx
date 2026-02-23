import React from "react"
import { Document, Page, Text, View } from "@react-pdf/renderer"
import { pdfStyles, lineStyleToBorderWidth } from "../styles"
import { DAY_NAMES } from "@/lib/constants"
import type { TimetableData } from "@/hooks/useTimetableData"
import type { PrintSettings } from "@/types/review.types"

interface Props {
  data: TimetableData
  settings: PrintSettings
}

export function RoomScheduleReport({ data, settings }: Props) {
  const komaMap = new Map(data.komas.map((k) => [k.id, k]))
  const subjectMap = new Map(data.subjects.map((s) => [s.id, s]))
  const daysPerWeek = data.school?.daysPerWeek ?? 5
  const maxPeriods = data.school?.maxPeriodsPerDay ?? 6
  const bw = lineStyleToBorderWidth(settings.gridLines.inner)
  const obw = lineStyleToBorderWidth(settings.gridLines.outer)

  const targetRooms =
    settings.selectedIds.length > 0
      ? data.rooms.filter((r) => settings.selectedIds.includes(r.id))
      : data.rooms

  return (
    <Document>
      {targetRooms.map((room) => (
        <Page key={room.id} size="A4" orientation="landscape" style={pdfStyles.page}>
          <Text style={pdfStyles.title}>{room.name} 利用予定</Text>
          <View style={[pdfStyles.table, { borderWidth: obw, borderColor: "#000" }]}>
            <View style={pdfStyles.tableHeaderRow}>
              <View style={[pdfStyles.headerCell, { borderRightWidth: bw, borderColor: "#000" }]}>
                <Text>時限</Text>
              </View>
              {Array.from({ length: daysPerWeek }, (_, d) => (
                <View
                  key={d}
                  style={[pdfStyles.tableCellHeader, { borderRightWidth: bw, borderColor: "#000" }]}
                >
                  <Text>{DAY_NAMES[d]}</Text>
                </View>
              ))}
            </View>
            {Array.from({ length: maxPeriods }, (_, p) => (
              <View key={p} style={[pdfStyles.tableRow, { borderTopWidth: bw, borderColor: "#000" }]}>
                <View style={[pdfStyles.labelCell, { borderRightWidth: bw, borderColor: "#000" }]}>
                  <Text>{p + 1}</Text>
                </View>
                {Array.from({ length: daysPerWeek }, (_, d) => {
                  const slot = data.slots.find((s) => {
                    const k = komaMap.get(s.komaId)
                    return (
                      s.dayOfWeek === d &&
                      s.period === p + 1 &&
                      k?.komaRooms?.some((kr) => kr.roomId === room.id)
                    )
                  })
                  const koma = slot ? komaMap.get(slot.komaId) : null
                  const subject = koma ? subjectMap.get(koma.subjectId) : null
                  return (
                    <View
                      key={d}
                      style={[pdfStyles.tableCell, { borderRightWidth: bw, borderColor: "#000" }]}
                    >
                      <Text>{subject ? (subject.shortName || subject.name) : ""}</Text>
                    </View>
                  )
                })}
              </View>
            ))}
          </View>
          {settings.footer && <Text style={pdfStyles.footer}>{settings.footer}</Text>}
        </Page>
      ))}
    </Document>
  )
}
