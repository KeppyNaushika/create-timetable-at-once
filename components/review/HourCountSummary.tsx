"use client"

import { DAY_NAMES } from "@/lib/constants"
import type { Koma, Subject, TimetableSlot } from "@/types/common.types"

interface HourCountSummaryProps {
  slots: TimetableSlot[]
  komas: Koma[]
  subjects: Subject[]
  daysPerWeek: number
}

export function HourCountSummary({
  slots,
  komas,
  subjects,
  daysPerWeek,
}: HourCountSummaryProps) {
  const komaMap = new Map(komas.map((k) => [k.id, k]))

  // 教科別・曜日別集計
  const subjectDayCount = new Map<string, Map<number, number>>()
  const subjectTotal = new Map<string, number>()

  for (const slot of slots) {
    const koma = komaMap.get(slot.komaId)
    if (!koma) continue
    const sid = koma.subjectId

    if (!subjectDayCount.has(sid)) subjectDayCount.set(sid, new Map())
    const dayMap = subjectDayCount.get(sid)!
    dayMap.set(slot.dayOfWeek, (dayMap.get(slot.dayOfWeek) ?? 0) + 1)
    subjectTotal.set(sid, (subjectTotal.get(sid) ?? 0) + 1)
  }

  const usedSubjects = subjects.filter((s) => subjectTotal.has(s.id))
  const days = Array.from({ length: daysPerWeek }, (_, i) => i)

  if (usedSubjects.length === 0) {
    return (
      <div className="text-muted-foreground py-4 text-center text-sm">
        配置データがありません
      </div>
    )
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th className="bg-muted border px-2 py-1 text-left">教科</th>
          {days.map((d) => (
            <th key={d} className="bg-muted border px-2 py-1 text-center">
              {DAY_NAMES[d]}
            </th>
          ))}
          <th className="bg-muted border px-2 py-1 text-center font-bold">
            合計
          </th>
        </tr>
      </thead>
      <tbody>
        {usedSubjects.map((subject) => {
          const dayMap = subjectDayCount.get(subject.id)
          const total = subjectTotal.get(subject.id) ?? 0
          return (
            <tr key={subject.id}>
              <td
                className="border px-2 py-1"
                style={{ borderLeft: `3px solid ${subject.color}` }}
              >
                {subject.shortName || subject.name}
              </td>
              {days.map((d) => (
                <td key={d} className="border px-2 py-1 text-center">
                  {dayMap?.get(d) ?? ""}
                </td>
              ))}
              <td className="border px-2 py-1 text-center font-bold">
                {total}
              </td>
            </tr>
          )
        })}
        <tr className="font-bold">
          <td className="bg-muted/50 border px-2 py-1">合計</td>
          {days.map((d) => {
            const dayTotal = slots.filter((s) => s.dayOfWeek === d).length
            return (
              <td key={d} className="bg-muted/50 border px-2 py-1 text-center">
                {dayTotal || ""}
              </td>
            )
          })}
          <td className="bg-muted/50 border px-2 py-1 text-center">
            {slots.length}
          </td>
        </tr>
      </tbody>
    </table>
  )
}
