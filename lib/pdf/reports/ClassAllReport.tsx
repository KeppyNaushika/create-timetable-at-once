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

export function ClassAllReport({ data, settings }: Props) {
  const komaMap = new Map(data.komas.map((k) => [k.id, k]))
  const subjectMap = new Map(data.subjects.map((s) => [s.id, s]))
  const daysPerWeek = data.school?.daysPerWeek ?? 5
  const maxPeriods = data.school?.maxPeriodsPerDay ?? 6
  const bw = lineStyleToBorderWidth(settings.gridLines.inner)
  const obw = lineStyleToBorderWidth(settings.gridLines.outer)

  return (
    <Document>
      <Page size="B4" orientation="landscape" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>クラス全体表</Text>
        <View style={[pdfStyles.table, { borderWidth: obw, borderColor: "#000" }]}>
          <View style={pdfStyles.tableHeaderRow}>
            <View style={[pdfStyles.headerCell, { borderRightWidth: bw, borderColor: "#000" }]}>
              <Text>クラス</Text>
            </View>
            {Array.from({ length: daysPerWeek }, (_, d) =>
              Array.from({ length: maxPeriods }, (_, p) => (
                <View
                  key={`${d}-${p}`}
                  style={[pdfStyles.tableCellHeader, { borderRightWidth: bw, borderColor: "#000" }]}
                >
                  <Text>{`${DAY_NAMES[d]}${p + 1}`}</Text>
                </View>
              ))
            )}
          </View>
          {data.classes.map((cls) => (
            <View key={cls.id} style={[pdfStyles.tableRow, { borderTopWidth: bw, borderColor: "#000" }]}>
              <View style={[pdfStyles.labelCell, { borderRightWidth: bw, borderColor: "#000" }]}>
                <Text>{cls.name}</Text>
              </View>
              {Array.from({ length: daysPerWeek }, (_, d) =>
                Array.from({ length: maxPeriods }, (_, p) => {
                  const slot = data.slots.find((s) => {
                    const k = komaMap.get(s.komaId)
                    return (
                      s.dayOfWeek === d &&
                      s.period === p + 1 &&
                      k?.komaClasses?.some((kc) => kc.classId === cls.id)
                    )
                  })
                  const koma = slot ? komaMap.get(slot.komaId) : null
                  const subject = koma ? subjectMap.get(koma.subjectId) : null
                  return (
                    <View
                      key={`${d}-${p}`}
                      style={[pdfStyles.tableCell, { borderRightWidth: bw, borderColor: "#000" }]}
                    >
                      <Text>{subject?.shortName ?? ""}</Text>
                    </View>
                  )
                })
              )}
            </View>
          ))}
        </View>
        {settings.footer && <Text style={pdfStyles.footer}>{settings.footer}</Text>}
      </Page>
    </Document>
  )
}
