"use client"

import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAnnualHours } from "@/hooks/useAnnualHours"
import { useSchoolEvents } from "@/hooks/useSchoolEvents"
import { useTimetableData } from "@/hooks/useTimetableData"
import type { SchoolEvent } from "@/types/daily.types"

const EVENT_TYPE_COLORS: Record<string, string> = {
  holiday: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  national_holiday:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  school_event:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  exam: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  ceremony:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
}

export default function AnnualCalendarPage() {
  const { data: timetableData, loading: timetableLoading } = useTimetableData()
  const {
    events,
    loading: eventsLoading,
    fetchByDateRange,
    importHolidays,
  } = useSchoolEvents()
  const { annualData, loading: annualLoading, calculate } = useAnnualHours()

  const [year, setYear] = useState(() => {
    const now = new Date()
    // Japanese school year: April start
    return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  })

  const startDate = `${year}-04-01`
  const endDate = `${year + 1}-03-31`
  const daysPerWeek = timetableData.school?.daysPerWeek ?? 5

  // Load events and calculate
  useEffect(() => {
    fetchByDateRange(startDate, endDate)
  }, [startDate, endDate, fetchByDateRange])

  useEffect(() => {
    if (!timetableLoading) {
      calculate({ startDate, endDate, daysPerWeek })
    }
  }, [startDate, endDate, daysPerWeek, timetableLoading, calculate])

  // Group events by month
  const eventsByMonth = useMemo(() => {
    const groups = new Map<string, SchoolEvent[]>()
    for (const ev of events) {
      const month = ev.date.slice(0, 7) // "YYYY-MM"
      const list = groups.get(month) ?? []
      list.push(ev)
      groups.set(month, list)
    }
    return groups
  }, [events])

  // Subject name map
  const subjectNameMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of timetableData.subjects) {
      map.set(s.id, s.name)
    }
    return map
  }, [timetableData.subjects])

  const handleImportHolidays = useCallback(async () => {
    try {
      const response = await fetch("/data/holidays.json")
      if (!response.ok) return
      const holidays = (await response.json()) as {
        date: string
        name: string
      }[]
      // Filter to current school year
      const filtered = holidays.filter(
        (h) => h.date >= startDate && h.date <= endDate
      )
      await importHolidays(filtered)
    } catch {
      // Silently ignore if holidays.json doesn't exist
    }
  }, [startDate, endDate, importHolidays])

  const isLoading = timetableLoading || eventsLoading || annualLoading

  // Build month columns for the annual view
  const monthDates = useMemo(() => {
    const months: { label: string; yearMonth: string }[] = []
    for (let m = 4; m <= 12; m++) {
      months.push({
        label: `${m}月`,
        yearMonth: `${year}-${String(m).padStart(2, "0")}`,
      })
    }
    for (let m = 1; m <= 3; m++) {
      months.push({
        label: `${m}月`,
        yearMonth: `${year + 1}-${String(m).padStart(2, "0")}`,
      })
    }
    return months
  }, [year])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">年間カレンダー</h1>
          <p className="text-muted-foreground text-sm">
            年間行事予定と時数見込み
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleImportHolidays}>
          <Download className="mr-2 h-4 w-4" />
          祝日を取り込み
        </Button>
      </div>

      {/* Year selector */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setYear((y) => y - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarRange className="h-4 w-4" />
              {year}年度（{year}.4 - {year + 1}.3）
            </CardTitle>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setYear((y) => y + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          {/* Annual summary */}
          {annualData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">年間サマリー</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{annualData.totalDays}</p>
                    <p className="text-muted-foreground text-sm">
                      総授業可能日
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {annualData.classDays}
                    </p>
                    <p className="text-muted-foreground text-sm">授業日数</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {annualData.eventDays}
                    </p>
                    <p className="text-muted-foreground text-sm">行事・休日</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Annual hours by subject */}
          {annualData && Object.keys(annualData.hoursBySubject).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  科目別年間見込み時数
                </CardTitle>
                <CardDescription>
                  授業日数と週あたりコマ数から算出
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>科目</TableHead>
                      <TableHead className="text-right">
                        年間見込み時数
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(annualData.hoursBySubject)
                      .sort(([, a], [, b]) => b - a)
                      .map(([subjectId, hours]) => (
                        <TableRow key={subjectId}>
                          <TableCell className="font-medium">
                            {subjectNameMap.get(subjectId) ?? subjectId}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{hours}時間</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Monthly event listing */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {monthDates.map(({ label, yearMonth }) => {
              const monthEvents = eventsByMonth.get(yearMonth) ?? []
              return (
                <Card key={yearMonth}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{label}</CardTitle>
                    <CardDescription className="text-xs">
                      {monthEvents.length}件の行事
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {monthEvents.length === 0 ? (
                      <p className="text-muted-foreground text-xs">行事なし</p>
                    ) : (
                      <div className="space-y-1">
                        {monthEvents
                          .sort((a, b) => a.date.localeCompare(b.date))
                          .map((ev) => (
                            <div
                              key={ev.id}
                              className="flex items-center gap-2 text-xs"
                            >
                              <span className="text-muted-foreground font-mono">
                                {ev.date.slice(8)}日
                              </span>
                              <Badge
                                className={`px-1 py-0 text-[10px] ${
                                  EVENT_TYPE_COLORS[ev.eventType] ?? ""
                                }`}
                              >
                                {ev.name}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
