"use client"

import { useMemo } from "react"

import type { RescheduleProposal } from "@/types/daily.types"

interface RescheduleSlotPickerProps {
  proposals: RescheduleProposal[]
  onSelect: (date: string, period: number) => void
}

const SCORE_COLORS = [
  { min: 80, bg: "bg-green-100 hover:bg-green-200 border-green-300" },
  { min: 60, bg: "bg-blue-100 hover:bg-blue-200 border-blue-300" },
  { min: 40, bg: "bg-yellow-100 hover:bg-yellow-200 border-yellow-300" },
  { min: 20, bg: "bg-orange-100 hover:bg-orange-200 border-orange-300" },
  { min: 0, bg: "bg-red-100 hover:bg-red-200 border-red-300" },
]

function getScoreColor(score: number): string {
  for (const level of SCORE_COLORS) {
    if (score >= level.min) return level.bg
  }
  return SCORE_COLORS[SCORE_COLORS.length - 1].bg
}

export function RescheduleSlotPicker({
  proposals,
  onSelect,
}: RescheduleSlotPickerProps) {
  // Group proposals by date
  const groupedByDate = useMemo(() => {
    const map = new Map<string, RescheduleProposal[]>()
    for (const p of proposals) {
      const existing = map.get(p.targetDate) ?? []
      existing.push(p)
      map.set(p.targetDate, existing)
    }
    // Sort by date
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [proposals])

  // Determine max period across all proposals
  const maxPeriod = useMemo(() => {
    let max = 0
    for (const p of proposals) {
      if (p.targetPeriod > max) max = p.targetPeriod
    }
    return max
  }, [proposals])

  const periods = Array.from({ length: maxPeriod }, (_, i) => i + 1)

  if (proposals.length === 0) {
    return (
      <div className="text-muted-foreground py-4 text-center text-sm">
        振替候補がありません
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="overflow-auto">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="bg-muted border px-2 py-1.5 text-left whitespace-nowrap">
                日付
              </th>
              {periods.map((p) => (
                <th key={p} className="bg-muted border px-2 py-1.5 text-center">
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupedByDate.map(([date, dateProposals]) => {
              const proposalMap = new Map(
                dateProposals.map((p) => [p.targetPeriod, p])
              )

              return (
                <tr key={date}>
                  <td className="bg-muted/50 border px-2 py-1.5 font-medium whitespace-nowrap">
                    {date}
                  </td>
                  {periods.map((p) => {
                    const proposal = proposalMap.get(p)

                    if (!proposal) {
                      return (
                        <td
                          key={p}
                          className="text-muted-foreground border px-2 py-1.5 text-center"
                        >
                          -
                        </td>
                      )
                    }

                    return (
                      <td key={p} className="border p-0.5">
                        <button
                          type="button"
                          className={`w-full rounded border px-2 py-1 text-center font-medium transition-colors ${getScoreColor(
                            proposal.score
                          )}`}
                          onClick={() => onSelect(date, p)}
                          title={`${proposal.score}点 - ${proposal.reasons.join(", ")}`}
                        >
                          {proposal.score}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Score legend */}
      <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm border border-green-300 bg-green-100" />
          <span>80+</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm border border-blue-300 bg-blue-100" />
          <span>60-79</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm border border-yellow-300 bg-yellow-100" />
          <span>40-59</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm border border-orange-300 bg-orange-100" />
          <span>20-39</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm border border-red-300 bg-red-100" />
          <span>0-19</span>
        </div>
      </div>
    </div>
  )
}
