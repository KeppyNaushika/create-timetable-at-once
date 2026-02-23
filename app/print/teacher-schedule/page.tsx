"use client"

import { PrintPageLayout } from "@/components/print/PrintPageLayout"
import { PrintableGrid } from "@/components/print/PrintableGrid"

export default function TeacherSchedulePrintPage() {
  return (
    <PrintPageLayout reportType="teacher-schedule">
      {({ data, settings }) => {
        const daysPerWeek = data.school?.daysPerWeek ?? 5
        const maxPeriods = data.school?.maxPeriodsPerDay ?? 6
        const komaMap = new Map(data.komas.map((k) => [k.id, k]))

        return (
          <div>
            {data.teachers.map((teacher) => {
              const teacherSlots = data.slots.filter((s) => {
                const k = komaMap.get(s.komaId)
                return k?.komaTeachers?.some((kt) => kt.teacherId === teacher.id)
              })
              return (
                <PrintableGrid
                  key={teacher.id}
                  title={`${teacher.name} 時間割`}
                  slots={teacherSlots}
                  komas={data.komas}
                  subjects={data.subjects}
                  daysPerWeek={daysPerWeek}
                  maxPeriodsPerDay={maxPeriods}
                  gridLines={settings.gridLines}
                  footer={settings.footer}
                />
              )
            })}
          </div>
        )
      }}
    </PrintPageLayout>
  )
}
