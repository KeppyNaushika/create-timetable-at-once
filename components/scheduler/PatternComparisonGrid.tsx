"use client"

import { DAY_NAMES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { Koma, TimetableSlot } from "@/types/common.types"

interface PatternComparisonGridProps {
  patternSlots: { patternId: string; slots: TimetableSlot[] }[]
  komaLookup: Record<string, Koma>
  daysPerWeek: number
  maxPeriodsPerDay: number
  highlightDiffs: boolean
}

export function PatternComparisonGrid({
  patternSlots,
  komaLookup,
  daysPerWeek,
  maxPeriodsPerDay,
  highlightDiffs,
}: PatternComparisonGridProps) {
  // Detect differences
  function isDifferent(dayOfWeek: number, period: number): boolean {
    if (!highlightDiffs || patternSlots.length < 2) return false
    const first = patternSlots[0]?.slots
      .filter((s) => s.dayOfWeek === dayOfWeek && s.period === period)
      .map((s) => s.komaId)
      .sort()
      .join(",")

    return patternSlots.some((ps) => {
      const current = ps.slots
        .filter((s) => s.dayOfWeek === dayOfWeek && s.period === period)
        .map((s) => s.komaId)
        .sort()
        .join(",")
      return current !== first
    })
  }

  return (
    <div className="flex gap-4 overflow-x-auto">
      {patternSlots.map(({ patternId, slots }) => (
        <div key={patternId} className="min-w-[300px] flex-shrink-0">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="border p-1">時限</th>
                {Array.from({ length: daysPerWeek }, (_, d) => (
                  <th key={d} className="border p-1">
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
                    <td className="border p-1 text-center font-medium">
                      {period}
                    </td>
                    {Array.from({ length: daysPerWeek }, (_, d) => {
                      const cellSlots = slots.filter(
                        (s) => s.dayOfWeek === d && s.period === period
                      )
                      const diff = isDifferent(d, period)
                      return (
                        <td
                          key={d}
                          className={cn("border p-0.5", diff && "bg-yellow-50")}
                        >
                          {cellSlots.map((slot) => {
                            const koma = komaLookup[slot.komaId]
                            if (!koma) return null
                            return (
                              <div
                                key={slot.id}
                                className="rounded px-1 text-[10px] text-white"
                                style={{
                                  backgroundColor:
                                    koma.subject?.color ?? "#6B7280",
                                }}
                              >
                                {koma.subject?.shortName ?? "?"}
                              </div>
                            )
                          })}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
