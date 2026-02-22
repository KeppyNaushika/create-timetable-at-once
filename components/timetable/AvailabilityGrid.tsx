"use client"

import { useCallback } from "react"

import { AVAILABILITY_STATUS, DAY_NAMES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { TeacherAvailability } from "@/types/common.types"

interface AvailabilityGridProps {
  teacherId: string
  daysPerWeek: number
  maxPeriodsPerDay: number
  hasZeroPeriod: boolean
  availabilities: TeacherAvailability[]
  onToggle: (dayOfWeek: number, period: number, newStatus: string) => void
}

const STATUS_CYCLE = ["available", "unavailable", "preferred"] as const

const STATUS_COLORS: Record<string, string> = {
  available: "bg-green-100 text-green-800 border-green-300",
  unavailable: "bg-red-100 text-red-800 border-red-300",
  preferred: "bg-blue-100 text-blue-800 border-blue-300",
}

export function AvailabilityGrid({
  daysPerWeek,
  maxPeriodsPerDay,
  hasZeroPeriod,
  availabilities,
  onToggle,
}: AvailabilityGridProps) {
  const getStatus = useCallback(
    (dayOfWeek: number, period: number): string => {
      const found = availabilities.find(
        (a) => a.dayOfWeek === dayOfWeek && a.period === period
      )
      return found?.status ?? "available"
    },
    [availabilities]
  )

  const handleClick = useCallback(
    (dayOfWeek: number, period: number) => {
      const currentStatus = getStatus(dayOfWeek, period)
      const currentIndex = STATUS_CYCLE.indexOf(
        currentStatus as (typeof STATUS_CYCLE)[number]
      )
      const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length]
      onToggle(dayOfWeek, period, nextStatus)
    },
    [getStatus, onToggle]
  )

  const displayDays = DAY_NAMES.slice(0, daysPerWeek)
  const startPeriod = hasZeroPeriod ? 0 : 1
  const endPeriod = maxPeriodsPerDay
  const periods = Array.from(
    { length: endPeriod - startPeriod + 1 },
    (_, i) => startPeriod + i
  )

  return (
    <div className="space-y-2">
      <div className="text-muted-foreground flex gap-3 text-xs">
        {STATUS_CYCLE.map((status) => (
          <div key={status} className="flex items-center gap-1">
            <div
              className={cn("h-3 w-3 rounded border", STATUS_COLORS[status])}
            />
            {AVAILABILITY_STATUS[status]}
          </div>
        ))}
      </div>
      <div className="overflow-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="text-muted-foreground w-16 border p-1 text-center text-xs font-medium">
                時限
              </th>
              {displayDays.map((day, i) => (
                <th
                  key={i}
                  className="w-12 border p-1 text-center text-xs font-medium"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => (
              <tr key={period}>
                <td className="text-muted-foreground border p-1 text-center text-xs">
                  {period}
                </td>
                {displayDays.map((_, dayIndex) => {
                  const status = getStatus(dayIndex, period)
                  return (
                    <td key={dayIndex} className="border p-0.5">
                      <button
                        type="button"
                        className={cn(
                          "flex h-7 w-full items-center justify-center rounded border text-xs transition-colors",
                          STATUS_COLORS[status]
                        )}
                        onClick={() => handleClick(dayIndex, period)}
                      >
                        {AVAILABILITY_STATUS[
                          status as keyof typeof AVAILABILITY_STATUS
                        ] ?? ""}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
