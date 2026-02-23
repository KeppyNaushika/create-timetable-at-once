"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DAY_NAMES } from "@/lib/constants"
import type { Koma, Subject, TimetableSlot } from "@/types/common.types"

interface IndividualTimetableCardProps {
  title: string
  slots: TimetableSlot[]
  komas: Koma[]
  subjects: Subject[]
  daysPerWeek: number
  maxPeriodsPerDay: number
}

export function IndividualTimetableCard({
  title,
  slots,
  komas,
  subjects,
  daysPerWeek,
  maxPeriodsPerDay,
}: IndividualTimetableCardProps) {
  const komaMap = new Map(komas.map((k) => [k.id, k]))
  const subjectMap = new Map(subjects.map((s) => [s.id, s]))

  const slotMap = new Map<string, TimetableSlot>()
  for (const slot of slots) {
    slotMap.set(`${slot.dayOfWeek}-${slot.period}`, slot)
  }

  const days = Array.from({ length: daysPerWeek }, (_, i) => i)
  const periods = Array.from({ length: maxPeriodsPerDay }, (_, i) => i + 1)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border bg-muted px-3 py-2 text-sm w-16">時限</th>
              {days.map((d) => (
                <th key={d} className="border bg-muted px-3 py-2 text-sm">
                  {DAY_NAMES[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => (
              <tr key={p}>
                <td className="border bg-muted/50 px-3 py-2 text-center text-sm font-medium">
                  {p}
                </td>
                {days.map((d) => {
                  const slot = slotMap.get(`${d}-${p}`)
                  const koma = slot ? komaMap.get(slot.komaId) : null
                  const subject = koma
                    ? subjectMap.get(koma.subjectId)
                    : null

                  return (
                    <td
                      key={d}
                      className="border px-2 py-2 text-center text-sm"
                      style={{
                        backgroundColor: subject?.color
                          ? `${subject.color}15`
                          : undefined,
                      }}
                    >
                      {subject && (
                        <div>
                          <div className="font-medium">
                            {subject.shortName || subject.name}
                          </div>
                          {koma?.label && (
                            <div className="text-[10px] text-muted-foreground">
                              {koma.label}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
