"use client"

import { DAY_NAMES } from "@/lib/constants"
import type { Koma, Subject, TimetableSlot } from "@/types/common.types"
import type { GridLineConfig, LineStyle } from "@/types/review.types"

interface PrintableGridProps {
  title: string
  slots: TimetableSlot[]
  komas: Koma[]
  subjects: Subject[]
  daysPerWeek: number
  maxPeriodsPerDay: number
  gridLines: GridLineConfig
  footer?: string
}

function lineStyleToCSS(style: LineStyle): string {
  switch (style) {
    case "none":
      return "none"
    case "thin":
      return "1px solid #000"
    case "thick":
      return "2px solid #000"
    case "double":
      return "3px double #000"
    case "dotted":
      return "1px dotted #000"
    default:
      return "1px solid #000"
  }
}

export function PrintableGrid({
  title,
  slots,
  komas,
  subjects,
  daysPerWeek,
  maxPeriodsPerDay,
  gridLines,
  footer,
}: PrintableGridProps) {
  const komaMap = new Map(komas.map((k) => [k.id, k]))
  const subjectMap = new Map(subjects.map((s) => [s.id, s]))

  const slotMap = new Map<string, TimetableSlot>()
  for (const slot of slots) {
    slotMap.set(`${slot.dayOfWeek}-${slot.period}`, slot)
  }

  const days = Array.from({ length: daysPerWeek }, (_, i) => i)
  const periods = Array.from({ length: maxPeriodsPerDay }, (_, i) => i + 1)

  return (
    <div className="print-break-before">
      <h3 className="mb-2 text-center text-lg font-bold">{title}</h3>
      <table
        className="w-full border-collapse"
        style={{ border: lineStyleToCSS(gridLines.outer) }}
      >
        <thead>
          <tr>
            <th
              className="px-2 py-1 text-sm"
              style={{
                border: lineStyleToCSS(gridLines.inner),
              }}
            >
              時限
            </th>
            {days.map((d) => (
              <th
                key={d}
                className="px-2 py-1 text-sm"
                style={{
                  borderTop: lineStyleToCSS(gridLines.outer),
                  borderBottom: lineStyleToCSS(gridLines.inner),
                  borderLeft: lineStyleToCSS(gridLines.dayDivider),
                  borderRight:
                    d === daysPerWeek - 1
                      ? lineStyleToCSS(gridLines.outer)
                      : lineStyleToCSS(gridLines.dayDivider),
                }}
              >
                {DAY_NAMES[d]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((p) => (
            <tr key={p}>
              <td
                className="px-2 py-1 text-center text-sm font-medium"
                style={{ border: lineStyleToCSS(gridLines.inner) }}
              >
                {p}
              </td>
              {days.map((d) => {
                const slot = slotMap.get(`${d}-${p}`)
                const koma = slot ? komaMap.get(slot.komaId) : null
                const subject = koma ? subjectMap.get(koma.subjectId) : null

                return (
                  <td
                    key={d}
                    className="px-1 py-1 text-center text-sm"
                    style={{
                      borderTop: lineStyleToCSS(gridLines.inner),
                      borderBottom:
                        p === maxPeriodsPerDay
                          ? lineStyleToCSS(gridLines.outer)
                          : lineStyleToCSS(gridLines.inner),
                      borderLeft: lineStyleToCSS(gridLines.dayDivider),
                      borderRight:
                        d === daysPerWeek - 1
                          ? lineStyleToCSS(gridLines.outer)
                          : lineStyleToCSS(gridLines.dayDivider),
                    }}
                  >
                    {subject && (
                      <span>{subject.shortName || subject.name}</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {footer && (
        <div className="mt-1 text-right text-xs text-muted-foreground">
          {footer}
        </div>
      )}
    </div>
  )
}
