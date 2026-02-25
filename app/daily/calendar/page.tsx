"use client"

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDailySchedule } from "@/hooks/useDailySchedule"
import { useSchoolEvents } from "@/hooks/useSchoolEvents"
import type { DailySchedule } from "@/types/daily.types"
import type { SchoolEvent } from "@/types/daily.types"

const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"]

const SCHEDULE_TYPE_LABELS: Record<string, string> = {
  normal: "通常",
  shortened: "短縮",
  exam: "考査",
  event: "行事",
  holiday: "休日",
  custom: "その他",
}

const SCHEDULE_TYPE_COLORS: Record<string, string> = {
  normal:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  shortened:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  exam: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  event: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  holiday: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  custom: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
}

export default function CalendarPage() {
  const router = useRouter()
  const { schedules, loading, fetchByMonth } = useDailySchedule()
  const { events, fetchByDateRange } = useSchoolEvents()

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })

  // Fetch data when month changes
  useEffect(() => {
    fetchByMonth(currentMonth)
    const [year, month] = currentMonth.split("-").map(Number)
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
    fetchByDateRange(startDate, endDate)
  }, [currentMonth, fetchByMonth, fetchByDateRange])

  // Build lookup maps
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
      const list = map.get(e.date) ?? []
      list.push(e)
      map.set(e.date, list)
    }
    return map
  }, [events])

  // Calendar grid
  const calendarDays = useMemo(() => {
    const [year, month] = currentMonth.split("-").map(Number)
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const startDow = firstDay.getDay()
    const totalDays = lastDay.getDate()

    const days: (number | null)[] = []
    // Pad start
    for (let i = 0; i < startDow; i++) {
      days.push(null)
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push(d)
    }
    // Pad end to fill the last week
    while (days.length % 7 !== 0) {
      days.push(null)
    }
    return days
  }, [currentMonth])

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      const [y, m] = prev.split("-").map(Number)
      const d = new Date(y, m - 2, 1)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    })
  }, [])

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      const [y, m] = prev.split("-").map(Number)
      const d = new Date(y, m, 1)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    })
  }, [])

  const handleDateClick = useCallback(
    (day: number) => {
      const [year, month] = currentMonth.split("-")
      const date = `${year}-${month}-${String(day).padStart(2, "0")}`
      router.push(`/daily/edit?date=${date}`)
    },
    [currentMonth, router]
  )

  const [year, month] = currentMonth.split("-").map(Number)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">日課カレンダー</h1>
        <p className="text-muted-foreground text-sm">
          日付をクリックして日課を編集します
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarIcon className="h-4 w-4" />
              {year}年{month}月
            </CardTitle>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="bg-muted grid grid-cols-7 gap-px rounded-lg border">
              {/* Day headers */}
              {DAY_NAMES.map((name, idx) => (
                <div
                  key={name}
                  className={`bg-background p-2 text-center text-sm font-medium ${
                    idx === 0
                      ? "text-red-500"
                      : idx === 6
                        ? "text-blue-500"
                        : "text-muted-foreground"
                  }`}
                >
                  {name}
                </div>
              ))}
              {/* Day cells */}
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="bg-muted/30 min-h-[80px]"
                    />
                  )
                }

                const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                const schedule = scheduleMap.get(dateStr)
                const dateEvents = eventMap.get(dateStr) ?? []
                const dow = new Date(year, month - 1, day).getDay()

                return (
                  <button
                    key={day}
                    type="button"
                    className="bg-background hover:bg-muted/50 min-h-[80px] p-1.5 text-left transition-colors"
                    onClick={() => handleDateClick(day)}
                  >
                    <span
                      className={`text-sm font-medium ${
                        dow === 0
                          ? "text-red-500"
                          : dow === 6
                            ? "text-blue-500"
                            : ""
                      }`}
                    >
                      {day}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {schedule && (
                        <Badge
                          className={`block truncate px-1 py-0 text-[10px] leading-4 ${
                            SCHEDULE_TYPE_COLORS[schedule.scheduleType] ?? ""
                          }`}
                        >
                          {SCHEDULE_TYPE_LABELS[schedule.scheduleType] ??
                            schedule.scheduleType}
                        </Badge>
                      )}
                      {dateEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className="text-muted-foreground truncate text-[10px]"
                          title={ev.name}
                        >
                          {ev.name}
                        </div>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
