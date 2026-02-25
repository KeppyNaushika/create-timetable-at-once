import { Document, Page, Text, View } from "@react-pdf/renderer"
import React from "react"

import type { TimetableData } from "@/hooks/useTimetableData"
import type { PrintSettings } from "@/types/review.types"

import { lineStyleToBorderWidth, pdfStyles } from "../styles"

interface Props {
  data: TimetableData
  settings: PrintSettings
}

export function RemainingKomaReport({ data, settings }: Props) {
  const subjectMap = new Map(data.subjects.map((s) => [s.id, s]))
  const gradeMap = new Map(data.grades.map((g) => [g.id, g]))
  const teacherMap = new Map(data.teachers.map((t) => [t.id, t]))
  const bw = lineStyleToBorderWidth(settings.gridLines.inner)
  const obw = lineStyleToBorderWidth(settings.gridLines.outer)

  // 配置済み駒IDごとのカウント
  const placedCount = new Map<string, number>()
  for (const slot of data.slots) {
    placedCount.set(slot.komaId, (placedCount.get(slot.komaId) ?? 0) + 1)
  }

  // 残り駒 = count - placedCount
  const remainingKomas = data.komas
    .map((koma) => ({
      koma,
      placed: placedCount.get(koma.id) ?? 0,
      remaining: koma.count - (placedCount.get(koma.id) ?? 0),
    }))
    .filter((r) => r.remaining > 0)

  return (
    <Document>
      <Page size="A4" orientation="portrait" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>残り駒一覧</Text>
        <Text style={pdfStyles.subtitle}>
          未配置: {remainingKomas.reduce((s, r) => s + r.remaining, 0)}コマ
        </Text>
        {remainingKomas.length === 0 ? (
          <Text style={{ textAlign: "center", marginTop: 20, color: "#666" }}>
            全ての駒が配置済みです
          </Text>
        ) : (
          <View
            style={[pdfStyles.table, { borderWidth: obw, borderColor: "#000" }]}
          >
            <View style={pdfStyles.tableHeaderRow}>
              {[
                "教科",
                "学年",
                "ラベル",
                "必要数",
                "配置済",
                "残り",
                "担当先生",
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
            {remainingKomas.map(({ koma, placed, remaining }) => {
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
                    <Text>{koma.label}</Text>
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
                    <Text>{placed}</Text>
                  </View>
                  <View
                    style={[
                      pdfStyles.tableCell,
                      { borderRightWidth: bw, borderColor: "#000" },
                    ]}
                  >
                    <Text>{remaining}</Text>
                  </View>
                  <View
                    style={[
                      pdfStyles.tableCell,
                      { borderRightWidth: bw, borderColor: "#000" },
                    ]}
                  >
                    <Text>{teachers ?? ""}</Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}
        {settings.footer && (
          <Text style={pdfStyles.footer}>{settings.footer}</Text>
        )}
      </Page>
    </Document>
  )
}
