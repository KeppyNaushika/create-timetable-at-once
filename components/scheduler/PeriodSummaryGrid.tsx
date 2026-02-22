"use client"

import { DAY_NAMES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { PeriodSummaryResult } from "@/hooks/useKomaCheck"

interface PeriodSummaryGridProps {
  data: PeriodSummaryResult[]
  daysPerWeek: number
  maxPeriodsPerDay: number
}

export function PeriodSummaryGrid({
  data,
  daysPerWeek,
  maxPeriodsPerDay,
}: PeriodSummaryGridProps) {
  const getCell = (dayOfWeek: number, period: number) =>
    data.find((d) => d.dayOfWeek === dayOfWeek && d.period === period)

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2 text-xs font-medium">時限</th>
            {Array.from({ length: daysPerWeek }, (_, d) => (
              <th key={d} className="border p-2 text-xs font-medium">
                {DAY_NAMES[d]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: maxPeriodsPerDay }, (_, i) => {
            const period = i + 1
            return (
              <tr key={period}>
                <td className="border p-2 text-center text-xs font-medium">
                  {period}
                </td>
                {Array.from({ length: daysPerWeek }, (_, d) => {
                  const cell = getCell(d, period)
                  if (!cell)
                    return (
                      <td key={d} className="border p-2 text-center">
                        -
                      </td>
                    )
                  const isShort = cell.availableTeachers < cell.requiredSlots
                  return (
                    <td
                      key={d}
                      className={cn(
                        "border p-2 text-center text-xs",
                        isShort && "text-destructive bg-red-50 font-bold"
                      )}
                    >
                      <div>教員: {cell.availableTeachers}</div>
                      <div className="text-muted-foreground">
                        必要: {cell.requiredSlots}
                      </div>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
