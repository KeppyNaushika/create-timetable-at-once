"use client"

import { useCallback, useState } from "react"

import type { Koma, TimetablePattern } from "@/types/common.types"

export interface AnnualData {
  totalDays: number
  classDays: number
  eventDays: number
  hoursBySubject: Record<string, number>
}

export function useAnnualHours() {
  const [annualData, setAnnualData] = useState<AnnualData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculate = useCallback(
    async (params: {
      startDate: string
      endDate: string
      daysPerWeek: number
    }) => {
      try {
        setLoading(true)
        setError(null)

        // Fetch school events in the date range
        const events = await window.electronAPI.schoolEventGetByDateRange(
          params.startDate,
          params.endDate
        )

        // Build a set of event/holiday dates
        const eventDates = new Set<string>()
        for (const ev of events) {
          eventDates.add(ev.date)
        }

        // Calculate weekdays in range
        const start = new Date(params.startDate)
        const end = new Date(params.endDate)
        const weekdays: string[] = []
        const validDaysOfWeek = buildValidDaysOfWeek(params.daysPerWeek)

        const current = new Date(start)
        while (current <= end) {
          const dayOfWeek = current.getDay() // 0=Sun, 1=Mon, ...
          if (validDaysOfWeek.has(dayOfWeek)) {
            const dateStr = formatDate(current)
            weekdays.push(dateStr)
          }
          current.setDate(current.getDate() + 1)
        }

        const totalDays = weekdays.length
        const eventDays = weekdays.filter((d) => eventDates.has(d)).length
        const classDays = totalDays - eventDays

        // Fetch adopted pattern and komas to compute weekly hours by subject
        const [patterns, komas] = await Promise.all([
          window.electronAPI.patternGetAll(),
          window.electronAPI.komaGetAll(),
        ])

        const adopted = patterns.find(
          (p: TimetablePattern) => p.status === "adopted"
        )

        let weeklyHoursBySubject: Record<string, number> = {}

        if (adopted) {
          const patternWithSlots = await window.electronAPI.patternGetWithSlots(
            adopted.id
          )
          const slots = patternWithSlots?.slots ?? []

          // Build koma map
          const komaMap = new Map<string, Koma>()
          for (const k of komas) {
            komaMap.set(k.id, k)
          }

          // Count weekly slots per subject from adopted pattern
          for (const slot of slots) {
            const koma = komaMap.get(slot.komaId)
            if (koma) {
              const subjectId = koma.subjectId
              weeklyHoursBySubject[subjectId] =
                (weeklyHoursBySubject[subjectId] ?? 0) + 1
            }
          }
        }

        // Calculate annual hours: classDays / daysPerWeek * weeklyHours
        const weeksCount = classDays / params.daysPerWeek
        const hoursBySubject: Record<string, number> = {}
        for (const [subjectId, weeklyCount] of Object.entries(
          weeklyHoursBySubject
        )) {
          hoursBySubject[subjectId] = Math.round(weeksCount * weeklyCount)
        }

        const result: AnnualData = {
          totalDays,
          classDays,
          eventDays,
          hoursBySubject,
        }

        setAnnualData(result)
        return result
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "年間時数の計算に失敗しました"
        )
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    annualData,
    loading,
    error,
    calculate,
  }
}

/** Build a set of valid JS Date.getDay() values (0=Sun..6=Sat) for school days */
function buildValidDaysOfWeek(daysPerWeek: number): Set<number> {
  // Common school schedules: Mon-Fri (5), Mon-Sat (6)
  const days = new Set<number>()
  // 1=Mon through daysPerWeek
  for (let i = 1; i <= daysPerWeek; i++) {
    // Map 1..7 to JS getDay: 1=Mon, 2=Tue, ..., 6=Sat, 7 wraps to 0=Sun
    days.add(i % 7)
  }
  return days
}

/** Format Date to "YYYY-MM-DD" */
function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}
