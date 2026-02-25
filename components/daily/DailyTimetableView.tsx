"use client"

import { useMemo } from "react"

import type {
  ClassInfo,
  Koma,
  Teacher,
  TimetableSlot,
} from "@/types/common.types"
import type { DailyChange } from "@/types/daily.types"

interface DailyTimetableViewProps {
  date: string
  dayOfWeek: number
  classes: ClassInfo[]
  slots: TimetableSlot[]
  komas: Koma[]
  changes: DailyChange[]
  teachers: Teacher[]
  maxPeriods: number
}

const CHANGE_STYLES: Record<string, { bg: string; text: string }> = {
  cancel: { bg: "bg-red-50", text: "text-red-600 line-through" },
  substitute: { bg: "bg-yellow-50", text: "text-yellow-800" },
  swap: { bg: "bg-blue-50", text: "text-blue-700" },
  self_study: { bg: "bg-gray-100", text: "text-gray-600" },
  special: { bg: "bg-purple-50", text: "text-purple-700" },
}

export function DailyTimetableView({
  date,
  dayOfWeek,
  classes,
  slots,
  komas,
  changes,
  teachers,
  maxPeriods,
}: DailyTimetableViewProps) {
  const komaMap = useMemo(() => new Map(komas.map((k) => [k.id, k])), [komas])
  const teacherMap = useMemo(
    () => new Map(teachers.map((t) => [t.id, t])),
    [teachers]
  )

  // Build slot lookup: classId -> period -> slot
  const slotLookup = useMemo(() => {
    const map = new Map<string, Map<number, TimetableSlot>>()
    for (const slot of slots) {
      if (slot.dayOfWeek !== dayOfWeek) continue
      const koma = komaMap.get(slot.komaId)
      if (!koma) continue
      const classIds = koma.komaClasses?.map((kc) => kc.classId) ?? []
      for (const classId of classIds) {
        if (!map.has(classId)) map.set(classId, new Map())
        map.get(classId)!.set(slot.period, slot)
      }
    }
    return map
  }, [slots, dayOfWeek, komaMap])

  // Build change lookup: classId -> period -> DailyChange
  const changeLookup = useMemo(() => {
    const map = new Map<string, Map<number, DailyChange>>()
    for (const change of changes) {
      if (!map.has(change.classId)) map.set(change.classId, new Map())
      map.get(change.classId)!.set(change.period, change)
    }
    return map
  }, [changes])

  const periods = Array.from({ length: maxPeriods }, (_, i) => i + 1)

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">{date} 時間割</h3>
      <div className="overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="bg-muted w-16 border px-3 py-2 text-center">
                時限
              </th>
              {classes.map((cls) => (
                <th
                  key={cls.id}
                  className="bg-muted border px-3 py-2 text-center"
                >
                  {cls.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => (
              <tr key={period}>
                <td className="bg-muted/50 border px-3 py-2 text-center font-medium">
                  {period}
                </td>
                {classes.map((cls) => {
                  const slot = slotLookup.get(cls.id)?.get(period)
                  const koma = slot ? komaMap.get(slot.komaId) : null
                  const subject = koma?.subject
                  const change = changeLookup.get(cls.id)?.get(period)
                  const changeStyle = change
                    ? CHANGE_STYLES[change.changeType]
                    : null
                  const substituteTeacher = change?.substituteTeacherId
                    ? teacherMap.get(change.substituteTeacherId)
                    : null

                  return (
                    <td
                      key={cls.id}
                      className={`border px-2 py-1.5 text-center ${
                        changeStyle?.bg ?? ""
                      }`}
                    >
                      {/* Base timetable subject */}
                      {subject && (
                        <div className={changeStyle?.text ?? ""}>
                          {subject.shortName || subject.name}
                        </div>
                      )}

                      {/* Change overlay */}
                      {change && (
                        <div className="mt-0.5">
                          {change.changeType === "self_study" && (
                            <span className="text-xs text-gray-500">自習</span>
                          )}
                          {change.changeType === "substitute" &&
                            substituteTeacher && (
                              <span className="text-[10px] text-yellow-700">
                                {substituteTeacher.name}
                              </span>
                            )}
                          {change.changeType === "swap" && (
                            <span className="text-[10px] text-blue-600">
                              交換
                            </span>
                          )}
                          {change.changeType === "special" && (
                            <span className="text-[10px] text-purple-600">
                              特別
                            </span>
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
      </div>

      {/* Legend */}
      <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm border border-red-200 bg-red-50" />
          <span>休講</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm border border-yellow-200 bg-yellow-50" />
          <span>代替</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm border border-blue-200 bg-blue-50" />
          <span>交換</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm border border-gray-300 bg-gray-100" />
          <span>自習</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm border border-purple-200 bg-purple-50" />
          <span>特別授業</span>
        </div>
      </div>
    </div>
  )
}
