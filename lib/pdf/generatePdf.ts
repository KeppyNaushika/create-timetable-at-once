import React from "react"
import { pdf } from "@react-pdf/renderer"
import type { TimetableData } from "@/hooks/useTimetableData"
import type { ReportType, PrintSettings } from "@/types/review.types"
import { TeacherAllReport } from "./reports/TeacherAllReport"
import { ClassAllReport } from "./reports/ClassAllReport"
import { TeacherScheduleReport } from "./reports/TeacherScheduleReport"
import { ClassScheduleReport } from "./reports/ClassScheduleReport"
import { RoomScheduleReport } from "./reports/RoomScheduleReport"
import { DutyListReport } from "./reports/DutyListReport"
import { TeacherListReport } from "./reports/TeacherListReport"
import { KomaListReport } from "./reports/KomaListReport"
import { RemainingKomaReport } from "./reports/RemainingKomaReport"

const reportComponents: Record<
  ReportType,
  React.FC<{ data: TimetableData; settings: PrintSettings }>
> = {
  "teacher-all": TeacherAllReport,
  "class-all": ClassAllReport,
  "teacher-schedule": TeacherScheduleReport,
  "class-schedule": ClassScheduleReport,
  "room-schedule": RoomScheduleReport,
  "duty-list": DutyListReport,
  "teacher-list": TeacherListReport,
  "koma-list": KomaListReport,
  "remaining-koma": RemainingKomaReport,
}

export async function generatePdfBlob(
  reportType: ReportType,
  data: TimetableData,
  settings: PrintSettings
): Promise<Blob> {
  const Component = reportComponents[reportType]
  if (!Component) {
    throw new Error(`未知のレポートタイプ: ${reportType}`)
  }

  const element = React.createElement(Component, { data, settings })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = await pdf(element as any).toBlob()
  return blob
}
