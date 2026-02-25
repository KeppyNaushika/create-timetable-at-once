import type { SchoolEvent } from "@/types/daily.types"

interface AnnualCountInput {
  startDate: string // "YYYY-MM-DD"
  endDate: string // "YYYY-MM-DD"
  daysPerWeek: number // 5 or 6
  maxPeriodsPerDay: number
  events: SchoolEvent[]
}

interface AnnualCountResult {
  totalWeekdays: number
  eventDays: number
  classDays: number
  totalPlannedHours: number
  hoursByDayOfWeek: number[] // hours per day of week (index 0=Sun..6=Sat)
}

/**
 * Parse a "YYYY-MM-DD" string into a Date.
 */
function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Format a Date as "YYYY-MM-DD".
 */
function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/**
 * Check if a dayOfWeek (0=Sun..6=Sat) is a school day given daysPerWeek.
 */
function isSchoolDay(dayOfWeek: number, daysPerWeek: number): boolean {
  if (dayOfWeek === 0) return false // Sunday never a school day
  if (daysPerWeek === 5) return dayOfWeek >= 1 && dayOfWeek <= 5
  if (daysPerWeek === 6) return dayOfWeek >= 1 && dayOfWeek <= 6
  return dayOfWeek >= 1 && dayOfWeek <= 5
}

/**
 * Calculate annual hour counts, accounting for school events and holidays.
 *
 * Algorithm:
 * - Iterate each date from startDate to endDate
 * - Count weekdays (Mon-Fri, or Mon-Sat if 6-day)
 * - Subtract event days (holidays, events with isAllDay=true)
 * - For partial days, subtract affectedPeriods
 * - totalPlannedHours = classDays * maxPeriodsPerDay - partial day reductions
 */
export function calculateAnnualHours(
  input: AnnualCountInput
): AnnualCountResult {
  const { startDate, endDate, daysPerWeek, maxPeriodsPerDay, events } = input

  // Build event lookup by date
  const eventsByDate = new Map<string, SchoolEvent[]>()
  for (const event of events) {
    const existing = eventsByDate.get(event.date)
    if (existing) {
      existing.push(event)
    } else {
      eventsByDate.set(event.date, [event])
    }
  }

  let totalWeekdays = 0
  let eventDays = 0
  let partialReductions = 0
  const hoursByDayOfWeek = [0, 0, 0, 0, 0, 0, 0] // Sun..Sat

  const current = parseDate(startDate)
  const end = parseDate(endDate)

  while (current <= end) {
    const dayOfWeek = current.getDay()
    const dateStr = formatDate(current)

    if (isSchoolDay(dayOfWeek, daysPerWeek)) {
      totalWeekdays++

      const dayEvents = eventsByDate.get(dateStr)
      let isFullDayOff = false
      let periodReduction = 0

      if (dayEvents) {
        for (const event of dayEvents) {
          if (event.isAllDay) {
            isFullDayOff = true
            break
          } else {
            periodReduction += event.affectedPeriods
          }
        }
      }

      if (isFullDayOff) {
        eventDays++
      } else {
        // This is a class day (possibly with partial reduction)
        const effectiveHours = Math.max(0, maxPeriodsPerDay - periodReduction)
        hoursByDayOfWeek[dayOfWeek] += effectiveHours
        partialReductions += periodReduction
      }
    }

    current.setDate(current.getDate() + 1)
  }

  const classDays = totalWeekdays - eventDays
  const totalPlannedHours = classDays * maxPeriodsPerDay - partialReductions

  return {
    totalWeekdays,
    eventDays,
    classDays,
    totalPlannedHours,
    hoursByDayOfWeek,
  }
}
