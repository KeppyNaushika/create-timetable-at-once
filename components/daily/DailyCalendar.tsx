"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { SCHEDULE_TYPES } from "@/lib/constants"
import type { DailySchedule, SchoolEvent } from "@/types/daily.types"

interface DailyCalendarProps {
  yearMonth: string // "YYYY-MM"
  schedules: DailySchedule[]
  events: SchoolEvent[]
  onDateClick: (date: string) => void
  onMonthChange: (yearMonth: string) => void
}

const WEEKDAY_HEADERS = ["月", "火", "水", "木", "金", "土", "日"] as const

const SCHEDULE_TYPE_COLORS: Record<string, string> = {
  normal: "bg-gray-100 text-gray-700 border-gray-300",
  shortened: "bg-blue-100 text-blue-700 border-blue-300",
  exam: "bg-red-100 text-red-700 border-red-300",
  event: "bg-orange-100 text-orange-700 border-orange-300",
  holiday: "bg-green-100 text-green-700 border-green-300",
  custom: "bg-purple-100 text-purple-700 border-purple-300",
}

export function DailyCalendar({
  yearMonth,
  schedules,
  events,
  onDateClick,
  onMonthChange,
}: DailyCalendarProps) {
  const [year, month] = yearMonth.split("-").map(Number)

  const scheduleMap = useMemo(() => {
    const map = new Map<string, DailySchedule>()
    for (const s of schedules) {
      map.set(s.date, s)
    }
    return map
  }, [schedules])

  const eventMap = useMemo(() => {
    const map = new Map<string, SchoolEvent[]>()
    for (const e of events) {
      const existing = map.get(e.date) ?? []
      existing.push(e)
      map.set(e.date, existing)
    }
    return map
  }, [events])

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const daysInMonth = lastDay.getDate()

    // Monday = 0, Sunday = 6
    let startDow = firstDay.getDay() - 1
    if (startDow < 0) startDow = 6

    const days: (number | null)[] = []

    // Leading empty cells
    for (let i = 0; i < startDow; i++) {
      days.push(null)
    }

    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d)
    }

    // Trailing empty cells to fill the last row
    while (days.length % 7 !== 0) {
      days.push(null)
    }

    return days
  }, [year, month])

  const handlePrevMonth = () => {
    const prev = new Date(year, month - 2, 1)
    const y = prev.getFullYear()
    const m = String(prev.getMonth() + 1).padStart(2, "0")
    onMonthChange(`${y}-${m}`)
  }

  const handleNextMonth = () => {
    const next = new Date(year, month, 1)
    const y = next.getFullYear()
    const m = String(next.getMonth() + 1).padStart(2, "0")
    onMonthChange(`${y}-${m}`)
  }

  const formatDate = (day: number): string => {
    const m = String(month).padStart(2, "0")
    const d = String(day).padStart(2, "0")
    return `${year}-${m}-${d}`
  }

  const isWeekend = (day: number): boolean => {
    const date = new Date(year, month - 1, day)
    const dow = date.getDay()
    return dow === 0 || dow === 6
  }

  return (
    <div className="space-y-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold">
          {year}年{month}月
        </h2>
        <Button variant="ghost" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px rounded-lg border bg-border">
        {/* Weekday headers */}
        {WEEKDAY_HEADERS.map((name, i) => (
          <div
            key={name}
            className={`bg-muted px-2 py-2 text-center text-sm font-medium ${
              i >= 5 ? "text-muted-foreground" : ""
            }`}
          >
            {name}
          </div>
        ))}

        {/* Day cells */}
        {calendarDays.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="bg-background p-2" />
          }

          const dateStr = formatDate(day)
          const schedule = scheduleMap.get(dateStr)
          const dayEvents = eventMap.get(dateStr)
          const weekend = isWeekend(day)
          const scheduleType = schedule?.scheduleType ?? null
          const colorClass = scheduleType
            ? SCHEDULE_TYPE_COLORS[scheduleType]
            : null
          const typeLabel = scheduleType
            ? SCHEDULE_TYPES[scheduleType as keyof typeof SCHEDULE_TYPES]
            : null

          return (
            <button
              key={day}
              type="button"
              className={`min-h-[80px] p-1.5 text-left transition-colors hover:bg-accent/50 ${
                weekend ? "bg-muted/40" : "bg-background"
              }`}
              onClick={() => onDateClick(dateStr)}
            >
              <div className="text-sm font-medium">{day}</div>
              {typeLabel && colorClass && (
                <Badge
                  variant="outline"
                  className={`mt-0.5 text-[10px] px-1 py-0 ${colorClass}`}
                >
                  {typeLabel}
                </Badge>
              )}
              {dayEvents?.map((ev) => (
                <div
                  key={ev.id}
                  className="mt-0.5 truncate text-[10px] leading-tight text-orange-600"
                  title={ev.name}
                >
                  {ev.name}
                </div>
              ))}
            </button>
          )
        })}
      </div>
    </div>
  )
}
