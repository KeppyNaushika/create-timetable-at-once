import { Document, Page, Text, View } from "@react-pdf/renderer"
import React from "react"

import type { TimetableData } from "@/hooks/useTimetableData"
import type { PrintSettings } from "@/types/review.types"

import { lineStyleToBorderWidth, pdfStyles } from "../styles"

interface Props {
  data: TimetableData
  settings: PrintSettings
}

export function KomaListReport({ data, settings }: Props) {
  const subjectMap = new Map(data.subjects.map((s) => [s.id, s]))
  const gradeMap = new Map(data.grades.map((g) => [g.id, g]))
  const teacherMap = new Map(data.teachers.map((t) => [t.id, t]))
  const bw = lineStyleToBorderWidth(settings.gridLines.inner)
  const obw = lineStyleToBorderWidth(settings.gridLines.outer)

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>駒一覧</Text>
        <View
          style={[pdfStyles.table, { borderWidth: obw, borderColor: "#000" }]}
        >
          <View style={pdfStyles.tableHeaderRow}>
            {[
              "教科",
              "学年",
              "タイプ",
              "コマ数",
              "ラベル",
              "担当先生",
              "優先度",
            ].map((h) => (
              <View
                key={h}
                style={[
                  pdfStyles.tableCellHeader,
                  { borderRightWidth: bw, borderColor: "#000" },
                ]}
              >
                <Text>{h}</Text>
              </View>
            ))}
          </View>
          {data.komas.map((koma) => {
            const subject = subjectMap.get(koma.subjectId)
            const grade = gradeMap.get(koma.gradeId)
            const teachers = koma.komaTeachers
              ?.map((kt) => teacherMap.get(kt.teacherId)?.name ?? "")
              .filter(Boolean)
              .join(", ")

            return (
              <View
                key={koma.id}
                style={[
                  pdfStyles.tableRow,
                  { borderTopWidth: bw, borderColor: "#000" },
                ]}
              >
                <View
                  style={[
                    pdfStyles.tableCell,
                    { borderRightWidth: bw, borderColor: "#000" },
                  ]}
                >
                  <Text>{subject?.name ?? ""}</Text>
                </View>
                <View
                  style={[
                    pdfStyles.tableCell,
                    { borderRightWidth: bw, borderColor: "#000" },
                  ]}
                >
                  <Text>{grade?.name ?? ""}</Text>
                </View>
                <View
                  style={[
                    pdfStyles.tableCell,
                    { borderRightWidth: bw, borderColor: "#000" },
                  ]}
                >
                  <Text>{koma.type === "consecutive" ? "連続" : "普通"}</Text>
                </View>
                <View
                  style={[
                    pdfStyles.tableCell,
                    { borderRightWidth: bw, borderColor: "#000" },
                  ]}
                >
                  <Text>{koma.count}</Text>
                </View>
                <View
                  style={[
                    pdfStyles.tableCell,
                    { borderRightWidth: bw, borderColor: "#000" },
                  ]}
                >
                  <Text>{koma.label}</Text>
                </View>
                <View
                  style={[
                    pdfStyles.tableCell,
                    { borderRightWidth: bw, borderColor: "#000" },
                  ]}
                >
                  <Text>{teachers ?? ""}</Text>
                </View>
                <View
                  style={[
                    pdfStyles.tableCell,
                    { borderRightWidth: bw, borderColor: "#000" },
                  ]}
                >
                  <Text>{koma.priority}</Text>
                </View>
              </View>
            )
          })}
        </View>
        {settings.footer && (
          <Text style={pdfStyles.footer}>{settings.footer}</Text>
        )}
      </Page>
    </Document>
  )
}
