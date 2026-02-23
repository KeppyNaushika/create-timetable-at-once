import React from "react"
import { Document, Page, Text, View } from "@react-pdf/renderer"
import { pdfStyles, lineStyleToBorderWidth } from "../styles"
import type { TimetableData } from "@/hooks/useTimetableData"
import type { PrintSettings } from "@/types/review.types"

interface Props {
  data: TimetableData
  settings: PrintSettings
}

export function TeacherListReport({ data, settings }: Props) {
  const subjectMap = new Map(data.subjects.map((s) => [s.id, s]))
  const bw = lineStyleToBorderWidth(settings.gridLines.inner)
  const obw = lineStyleToBorderWidth(settings.gridLines.outer)

  return (
    <Document>
      <Page size="A4" orientation="portrait" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>先生一覧表</Text>
        <View style={[pdfStyles.table, { borderWidth: obw, borderColor: "#000" }]}>
          <View style={pdfStyles.tableHeaderRow}>
            {["氏名", "カナ", "主担当教科", "1日最大", "連続最大", "週最大", "備考"].map(
              (h) => (
                <View
                  key={h}
                  style={[pdfStyles.tableCellHeader, { borderRightWidth: bw, borderColor: "#000" }]}
                >
                  <Text>{h}</Text>
                </View>
              )
            )}
          </View>
          {data.teachers.map((teacher) => {
            const mainSubject = teacher.mainSubjectId
              ? subjectMap.get(teacher.mainSubjectId)
              : null
            return (
              <View
                key={teacher.id}
                style={[pdfStyles.tableRow, { borderTopWidth: bw, borderColor: "#000" }]}
              >
                <View style={[pdfStyles.tableCell, { borderRightWidth: bw, borderColor: "#000" }]}>
                  <Text>{teacher.name}</Text>
                </View>
                <View style={[pdfStyles.tableCell, { borderRightWidth: bw, borderColor: "#000" }]}>
                  <Text>{teacher.nameKana}</Text>
                </View>
                <View style={[pdfStyles.tableCell, { borderRightWidth: bw, borderColor: "#000" }]}>
                  <Text>{mainSubject?.name ?? ""}</Text>
                </View>
                <View style={[pdfStyles.tableCell, { borderRightWidth: bw, borderColor: "#000" }]}>
                  <Text>{teacher.maxPerDay}</Text>
                </View>
                <View style={[pdfStyles.tableCell, { borderRightWidth: bw, borderColor: "#000" }]}>
                  <Text>{teacher.maxConsecutive}</Text>
                </View>
                <View style={[pdfStyles.tableCell, { borderRightWidth: bw, borderColor: "#000" }]}>
                  <Text>{teacher.maxPeriodsPerWeek}</Text>
                </View>
                <View style={[pdfStyles.tableCell, { borderRightWidth: bw, borderColor: "#000" }]}>
                  <Text>{teacher.notes ?? ""}</Text>
                </View>
              </View>
            )
          })}
        </View>
        {settings.footer && <Text style={pdfStyles.footer}>{settings.footer}</Text>}
      </Page>
    </Document>
  )
}
