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

export function DutyListReport({ data, settings }: Props) {
  const bw = lineStyleToBorderWidth(settings.gridLines.inner)
  const obw = lineStyleToBorderWidth(settings.gridLines.outer)

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>校務一覧表</Text>
        <View style={[pdfStyles.table, { borderWidth: obw, borderColor: "#000" }]}>
          <View style={pdfStyles.tableHeaderRow}>
            {["校務名", "略称", "曜日", "時限", "担当者"].map((h) => (
              <View
                key={h}
                style={[pdfStyles.tableCellHeader, { borderRightWidth: bw, borderColor: "#000" }]}
              >
                <Text>{h}</Text>
              </View>
            ))}
          </View>
          {data.duties.map((duty) => (
            <View key={duty.id} style={[pdfStyles.tableRow, { borderTopWidth: bw, borderColor: "#000" }]}>
              <View style={[pdfStyles.tableCell, { borderRightWidth: bw, borderColor: "#000" }]}>
                <Text>{duty.name}</Text>
              </View>
              <View style={[pdfStyles.tableCell, { borderRightWidth: bw, borderColor: "#000" }]}>
                <Text>{duty.shortName}</Text>
              </View>
              <View style={[pdfStyles.tableCell, { borderRightWidth: bw, borderColor: "#000" }]}>
                <Text>{DAY_NAMES[duty.dayOfWeek] ?? ""}</Text>
              </View>
              <View style={[pdfStyles.tableCell, { borderRightWidth: bw, borderColor: "#000" }]}>
                <Text>{duty.period}</Text>
              </View>
              <View style={[pdfStyles.tableCell, { borderRightWidth: bw, borderColor: "#000" }]}>
                <Text>
                  {duty.teacherDuties
                    ?.map((td) => td.teacher?.name ?? "")
                    .filter(Boolean)
                    .join(", ") ?? ""}
                </Text>
              </View>
            </View>
          ))}
        </View>
        {settings.footer && <Text style={pdfStyles.footer}>{settings.footer}</Text>}
      </Page>
    </Document>
  )
}
