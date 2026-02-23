"use client"

import { PrintPageLayout } from "@/components/print/PrintPageLayout"
import { DAY_NAMES } from "@/lib/constants"

export default function ClassAllPrintPage() {
  return (
    <PrintPageLayout reportType="class-all">
      {({ data, settings }) => {
        const daysPerWeek = data.school?.daysPerWeek ?? 5
        const maxPeriods = data.school?.maxPeriodsPerDay ?? 6
        const komaMap = new Map(data.komas.map((k) => [k.id, k]))
        const subjectMap = new Map(data.subjects.map((s) => [s.id, s]))

        return (
          <div>
            <h2 className="mb-4 text-center text-xl font-bold">クラス全体表</h2>
            <div className="overflow-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="border px-2 py-1 bg-muted text-left">クラス</th>
                    {Array.from({ length: daysPerWeek }, (_, d) =>
                      Array.from({ length: maxPeriods }, (_, p) => (
                        <th key={`${d}-${p}`} className="border px-1 py-1 bg-muted text-center">
                          {DAY_NAMES[d]}{p + 1}
                        </th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.classes.map((cls) => (
                    <tr key={cls.id}>
                      <td className="border px-2 py-1 whitespace-nowrap font-medium">{cls.name}</td>
                      {Array.from({ length: daysPerWeek }, (_, d) =>
                        Array.from({ length: maxPeriods }, (_, p) => {
                          const slot = data.slots.find((s) => {
                            const k = komaMap.get(s.komaId)
                            return s.dayOfWeek === d && s.period === p + 1 &&
                              k?.komaClasses?.some((kc) => kc.classId === cls.id)
                          })
                          const koma = slot ? komaMap.get(slot.komaId) : null
                          const subject = koma ? subjectMap.get(koma.subjectId) : null
                          return (
                            <td key={`${d}-${p}`} className="border px-1 py-1 text-center">
                              {subject?.shortName ?? ""}
                            </td>
                          )
                        })
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {settings.footer && (
              <div className="mt-2 text-right text-xs text-muted-foreground">{settings.footer}</div>
            )}
          </div>
        )
      }}
    </PrintPageLayout>
  )
}
