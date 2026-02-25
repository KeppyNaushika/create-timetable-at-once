import { Document, Page, Text, View } from "@react-pdf/renderer"
import React from "react"

import type { TimetableData } from "@/hooks/useTimetableData"
import { DAY_NAMES } from "@/lib/constants"
import type { PrintSettings } from "@/types/review.types"

import { lineStyleToBorderWidth, pdfStyles } from "../styles"

interface Props {
  data: TimetableData
  settings: PrintSettings
}

export function TeacherScheduleReport({ data, settings }: Props) {
  const komaMap = new Map(data.komas.map((k) => [k.id, k]))
  const subjectMap = new Map(data.subjects.map((s) => [s.id, s]))
  const daysPerWeek = data.school?.daysPerWeek ?? 5
  const maxPeriods = data.school?.maxPeriodsPerDay ?? 6
  const bw = lineStyleToBorderWidth(settings.gridLines.inner)
  const obw = lineStyleToBorderWidth(settings.gridLines.outer)

  const targetTeachers =
    settings.selectedIds.length > 0
      ? data.teachers.filter((t) => settings.selectedIds.includes(t.id))
      : data.teachers

  return (
    <Document>
      {targetTeachers.map((teacher) => (
        <Page
          key={teacher.id}
          size="A4"
          orientation="landscape"
          style={pdfStyles.page}
        >
          <Text style={pdfStyles.title}>{teacher.name} 時間割</Text>
          <View
            style={[pdfStyles.table, { borderWidth: obw, borderColor: "#000" }]}
          >
            <View style={pdfStyles.tableHeaderRow}>
              <View
                style={[
                  pdfStyles.headerCell,
                  { borderRightWidth: bw, borderColor: "#000" },
                ]}
              >
                <Text>時限</Text>
              </View>
              {Array.from({ length: daysPerWeek }, (_, d) => (
                <View
                  key={d}
                  style={[
                    pdfStyles.tableCellHeader,
                    { borderRightWidth: bw, borderColor: "#000" },
                  ]}
                >
                  <Text>{DAY_NAMES[d]}</Text>
                </View>
              ))}
            </View>
            {Array.from({ length: maxPeriods }, (_, p) => (
              <View
                key={p}
                style={[
                  pdfStyles.tableRow,
                  { borderTopWidth: bw, borderColor: "#000" },
                ]}
              >
                <View
                  style={[
                    pdfStyles.labelCell,
                    { borderRightWidth: bw, borderColor: "#000" },
                  ]}
                >
                  <Text>{p + 1}</Text>
                </View>
                {Array.from({ length: daysPerWeek }, (_, d) => {
                  const slot = data.slots.find((s) => {
                    const k = komaMap.get(s.komaId)
                    return (
                      s.dayOfWeek === d &&
                      s.period === p + 1 &&
                      k?.komaTeachers?.some((kt) => kt.teacherId === teacher.id)
                    )
                  })
                  const koma = slot ? komaMap.get(slot.komaId) : null
                  const subject = koma ? subjectMap.get(koma.subjectId) : null
                  return (
                    <View
                      key={d}
                      style={[
                        pdfStyles.tableCell,
                        { borderRightWidth: bw, borderColor: "#000" },
                      ]}
                    >
                      <Text>
                        {subject ? subject.shortName || subject.name : ""}
                      </Text>
                      {koma?.label ? (
                        <Text style={{ fontSize: 5, color: "#666" }}>
                          {koma.label}
                        </Text>
                      ) : null}
                    </View>
                  )
                })}
              </View>
            ))}
          </View>
          {settings.footer && (
            <Text style={pdfStyles.footer}>{settings.footer}</Text>
          )}
        </Page>
      ))}
    </Document>
  )
}
