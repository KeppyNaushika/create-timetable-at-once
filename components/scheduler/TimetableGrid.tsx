"use client"

import { DAY_NAMES } from "@/lib/constants"
import type { Koma, TimetableSlot } from "@/types/common.types"
import type { ViewMode } from "@/types/timetable.types"

import { TimetableCell } from "./TimetableCell"

interface TimetableGridProps {
  slots: TimetableSlot[]
  komaLookup: Record<string, Koma>
  daysPerWeek: number
  maxPeriodsPerDay: number
  viewMode: ViewMode
  selectedEntity: string | null
  selectedCell: { dayOfWeek: number; period: number } | null
  violationMap: Record<
    string,
    { message: string; severity: "error" | "warning" }[]
  >
  onCellClick: (dayOfWeek: number, period: number) => void
  onRemoveSlot: (slotId: string) => void
  onFixSlot: (slotId: string, isFixed: boolean) => void
}

export function TimetableGrid({
  slots,
  komaLookup,
  daysPerWeek,
  maxPeriodsPerDay,
  viewMode,
  selectedEntity,
  selectedCell,
  violationMap,
  onCellClick,
  onRemoveSlot,
  onFixSlot,
}: TimetableGridProps) {
  // Filter slots for the selected entity
  const filteredSlots = selectedEntity
    ? slots.filter((slot) => {
        const koma = komaLookup[slot.komaId]
        if (!koma) return false
        switch (viewMode) {
          case "teacher":
            return koma.komaTeachers?.some(
              (kt) => kt.teacherId === selectedEntity
            )
          case "class":
            return koma.komaClasses?.some((kc) => kc.classId === selectedEntity)
          case "room":
            return koma.komaRooms?.some((kr) => kr.roomId === selectedEntity)
          default:
            return true
        }
      })
    : slots

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="w-12 border p-1 text-xs font-medium">時限</th>
            {Array.from({ length: daysPerWeek }, (_, d) => (
              <th key={d} className="border p-1 text-xs font-medium">
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
                <td className="border p-1 text-center text-xs font-medium">
                  {period}
                </td>
                {Array.from({ length: daysPerWeek }, (_, d) => {
                  const cellSlots = filteredSlots.filter(
                    (s) => s.dayOfWeek === d && s.period === period
                  )
                  const cellKey = `${d}-${period}`
                  const violations = violationMap[cellKey] ?? []
                  const isSelected =
                    selectedCell?.dayOfWeek === d &&
                    selectedCell?.period === period

                  return (
                    <td key={d} className="p-0">
                      <TimetableCell
                        dayOfWeek={d}
                        period={period}
                        slots={cellSlots}
                        komaLookup={komaLookup}
                        violations={violations}
                        isSelected={isSelected}
                        onCellClick={onCellClick}
                        onRemoveSlot={onRemoveSlot}
                        onFixSlot={onFixSlot}
                      />
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
