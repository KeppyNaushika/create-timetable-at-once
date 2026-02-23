"use client"

import { DAY_NAMES } from "@/lib/constants"
import type { ClassInfo, Koma, TimetableSlot } from "@/types/common.types"
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
  disabledSlots?: Set<string>
  onCellClick: (dayOfWeek: number, period: number) => void
  onRemoveSlot: (slotId: string) => void
  onFixSlot: (slotId: string, isFixed: boolean) => void
  // "all" mode
  classes?: ClassInfo[]
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
  disabledSlots,
  onCellClick,
  onRemoveSlot,
  onFixSlot,
  classes,
}: TimetableGridProps) {
  if (viewMode === "all" && classes) {
    return (
      <AllClassGrid
        slots={slots}
        komaLookup={komaLookup}
        daysPerWeek={daysPerWeek}
        maxPeriodsPerDay={maxPeriodsPerDay}
        classes={classes}
        selectedCell={selectedCell}
        violationMap={violationMap}
        disabledSlots={disabledSlots}
        onCellClick={onCellClick}
        onRemoveSlot={onRemoveSlot}
        onFixSlot={onFixSlot}
      />
    )
  }

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
                  const isDisabled = disabledSlots?.has(`${d}:${period}`) ?? false
                  const cellSlots = filteredSlots.filter(
                    (s) => s.dayOfWeek === d && s.period === period
                  )
                  const cellKey = `${d}-${period}`
                  const violations = violationMap[cellKey] ?? []
                  const isSelected =
                    selectedCell?.dayOfWeek === d &&
                    selectedCell?.period === period

                  if (isDisabled) {
                    return (
                      <td
                        key={d}
                        className="bg-muted p-0"
                        title="無効スロット"
                      >
                        <div className="flex h-12 items-center justify-center border">
                          <span className="text-muted-foreground text-xs">
                            ×
                          </span>
                        </div>
                      </td>
                    )
                  }

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

// --- All-class grid ---

interface AllClassGridProps {
  slots: TimetableSlot[]
  komaLookup: Record<string, Koma>
  daysPerWeek: number
  maxPeriodsPerDay: number
  classes: ClassInfo[]
  selectedCell: { dayOfWeek: number; period: number } | null
  violationMap: Record<
    string,
    { message: string; severity: "error" | "warning" }[]
  >
  disabledSlots?: Set<string>
  onCellClick: (dayOfWeek: number, period: number) => void
  onRemoveSlot: (slotId: string) => void
  onFixSlot: (slotId: string, isFixed: boolean) => void
}

function AllClassGrid({
  slots,
  komaLookup,
  daysPerWeek,
  maxPeriodsPerDay,
  classes,
  selectedCell,
  violationMap,
  disabledSlots,
  onCellClick,
  onRemoveSlot,
  onFixSlot,
}: AllClassGridProps) {
  // Build classId -> slots index
  const classSlotIndex: Record<string, TimetableSlot[]> = {}
  for (const slot of slots) {
    const koma = komaLookup[slot.komaId]
    if (!koma) continue
    for (const kc of koma.komaClasses ?? []) {
      if (!classSlotIndex[kc.classId]) classSlotIndex[kc.classId] = []
      classSlotIndex[kc.classId].push(slot)
    }
  }

  // Sort classes by grade then sortOrder
  const sortedClasses = [...classes].sort((a, b) => {
    const gradeA = a.grade?.gradeNum ?? 0
    const gradeB = b.grade?.gradeNum ?? 0
    if (gradeA !== gradeB) return gradeA - gradeB
    return a.sortOrder - b.sortOrder
  })

  return (
    <div className="overflow-x-auto">
      {Array.from({ length: daysPerWeek }, (_, dayIdx) => (
        <div key={dayIdx} className="mb-4">
          <h3 className="mb-1 text-sm font-semibold">{DAY_NAMES[dayIdx]}</h3>
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr>
                <th className="w-8 border p-0.5 font-medium">限</th>
                {sortedClasses.map((cls) => (
                  <th
                    key={cls.id}
                    className="border p-0.5 font-medium"
                    style={{ minWidth: 64 }}
                  >
                    {cls.grade?.name ?? ""}{cls.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maxPeriodsPerDay }, (_, pIdx) => {
                const period = pIdx + 1
                return (
                  <tr key={period}>
                    <td className="border p-0.5 text-center font-medium">
                      {period}
                    </td>
                    {sortedClasses.map((cls) => {
                      const isDisabled =
                        disabledSlots?.has(`${dayIdx}:${period}`) ?? false
                      const cellSlots = (classSlotIndex[cls.id] ?? []).filter(
                        (s) => s.dayOfWeek === dayIdx && s.period === period
                      )
                      const cellKey = `${dayIdx}-${period}`
                      const violations = violationMap[cellKey] ?? []
                      const isSelected =
                        selectedCell?.dayOfWeek === dayIdx &&
                        selectedCell?.period === period

                      if (isDisabled) {
                        return (
                          <td
                            key={cls.id}
                            className="bg-muted border p-0"
                          >
                            <div className="flex h-8 items-center justify-center">
                              <span className="text-muted-foreground">×</span>
                            </div>
                          </td>
                        )
                      }

                      return (
                        <td key={cls.id} className="p-0">
                          <TimetableCell
                            dayOfWeek={dayIdx}
                            period={period}
                            slots={cellSlots}
                            komaLookup={komaLookup}
                            violations={violations}
                            isSelected={isSelected}
                            onCellClick={onCellClick}
                            onRemoveSlot={onRemoveSlot}
                            onFixSlot={onFixSlot}
                            compact
                            cellId={`cell-${dayIdx}-${period}-${cls.id}`}
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
      ))}
    </div>
  )
}
