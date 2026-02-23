"use client"

import { useMemo } from "react"
import type { SchoolEvent } from "@/types/daily.types"

interface AnnualCalendarProps {
  year: number
  events: SchoolEvent[]
  onDateClick?: (date: string) => void
}

const WEEKDAY_HEADERS = ["月", "火", "水", "木", "金", "土", "日"] as const
const MONTH_NAMES = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
] as const

function getEventColor(eventType: string): string {
  switch (eventType) {
    case "holiday":
    case "national_holiday":
      return "bg-red-200 text-red-800"
    case "school_event":
      return "bg-orange-200 text-orange-800"
    case "exam":
      return "bg-blue-200 text-blue-800"
    case "ceremony":
      return "bg-purple-200 text-purple-800"
    default:
      return "bg-gray-200 text-gray-800"
  }
}

interface MiniMonthProps {
  year: number
  month: number // 1-12
  eventMap: Map<string, SchoolEvent[]>
  onDateClick?: (date: string) => void
}

function MiniMonth({ year, month, eventMap, onDateClick }: MiniMonthProps) {
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const daysInMonth = lastDay.getDate()

    let startDow = firstDay.getDay() - 1
    if (startDow < 0) startDow = 6

    const days: (number | null)[] = []

    for (let i = 0; i < startDow; i++) {
      days.push(null)
    }

    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d)
    }

    while (days.length % 7 !== 0) {
      days.push(null)
    }

    return days
  }, [year, month])

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
    <div>
      <h3 className="mb-1 text-center text-sm font-semibold">
        {MONTH_NAMES[month - 1]}
      </h3>
      <div className="grid grid-cols-7 gap-px text-[10px]">
        {WEEKDAY_HEADERS.map((name) => (
          <div
            key={name}
            className="text-center font-medium text-muted-foreground py-0.5"
          >
            {name}
          </div>
        ))}
        {calendarDays.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} />
          }

          const dateStr = formatDate(day)
          const dayEvents = eventMap.get(dateStr)
          const weekend = isWeekend(day)
          const hasHoliday = dayEvents?.some(
            (e) =>
              e.eventType === "holiday" || e.eventType === "national_holiday"
          )
          const hasEvent = dayEvents?.some(
            (e) =>
              e.eventType !== "holiday" && e.eventType !== "national_holiday"
          )

          let cellClass = "text-center py-0.5 rounded-sm"
          if (hasHoliday) {
            cellClass += " bg-red-100 text-red-700 font-medium"
          } else if (hasEvent) {
            cellClass += " bg-orange-100 text-orange-700 font-medium"
          } else if (weekend) {
            cellClass += " text-muted-foreground"
          }

          if (onDateClick) {
            return (
              <button
                key={day}
                type="button"
                className={`${cellClass} hover:bg-accent transition-colors`}
                onClick={() => onDateClick(dateStr)}
                title={dayEvents?.map((e) => e.name).join(", ")}
              >
                {day}
              </button>
            )
          }

          return (
            <div
              key={day}
              className={cellClass}
              title={dayEvents?.map((e) => e.name).join(", ")}
            >
              {day}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AnnualCalendar({
  year,
  events,
  onDateClick,
}: AnnualCalendarProps) {
  const eventMap = useMemo(() => {
    const map = new Map<string, SchoolEvent[]>()
    for (const e of events) {
      const existing = map.get(e.date) ?? []
      existing.push(e)
      map.set(e.date, existing)
    }
    return map
  }, [events])

  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-center">{year}年</h2>
      <div className="grid grid-cols-4 gap-4">
        {months.map((month) => (
          <MiniMonth
            key={month}
            year={year}
            month={month}
            eventMap={eventMap}
            onDateClick={onDateClick}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-red-100 border border-red-200" />
          <span>休日・祝日</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-orange-100 border border-orange-200" />
          <span>行事</span>
        </div>
      </div>
    </div>
  )
}
