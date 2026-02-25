"use client"

import { PrintableGrid } from "@/components/print/PrintableGrid"
import { PrintPageLayout } from "@/components/print/PrintPageLayout"

export default function ClassSchedulePrintPage() {
  return (
    <PrintPageLayout reportType="class-schedule">
      {({ data, settings }) => {
        const daysPerWeek = data.school?.daysPerWeek ?? 5
        const maxPeriods = data.school?.maxPeriodsPerDay ?? 6
        const komaMap = new Map(data.komas.map((k) => [k.id, k]))

        return (
          <div>
            {data.classes.map((cls) => {
              const classSlots = data.slots.filter((s) => {
                const k = komaMap.get(s.komaId)
                return k?.komaClasses?.some((kc) => kc.classId === cls.id)
              })
              return (
                <PrintableGrid
                  key={cls.id}
                  title={`${cls.name} 時間割`}
                  slots={classSlots}
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
