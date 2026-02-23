"use client"

import { useCallback, useEffect, useState } from "react"

import type { SchoolEvent } from "@/types/daily.types"

export function useSchoolEvents() {
  const [events, setEvents] = useState<SchoolEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await window.electronAPI.schoolEventGetAll()
      setEvents(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "学校行事一覧の取得に失敗しました"
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchByDateRange = useCallback(
    async (startDate: string, endDate: string) => {
      try {
        setLoading(true)
        setError(null)
        const data = await window.electronAPI.schoolEventGetByDateRange(
          startDate,
          endDate
        )
        setEvents(data)
        return data
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "学校行事の期間検索に失敗しました"
        )
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const createEvent = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        setError(null)
        const created = await window.electronAPI.schoolEventCreate(data)
        await fetchAll()
        return created
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "学校行事の追加に失敗しました"
        )
        throw err
      }
    },
    [fetchAll]
  )

  const updateEvent = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      try {
        setError(null)
        const updated = await window.electronAPI.schoolEventUpdate(id, data)
        await fetchAll()
        return updated
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "学校行事の更新に失敗しました"
        )
        throw err
      }
    },
    [fetchAll]
  )

  const deleteEvent = useCallback(
    async (id: string) => {
      try {
        setError(null)
        await window.electronAPI.schoolEventDelete(id)
        await fetchAll()
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "学校行事の削除に失敗しました"
        )
        throw err
      }
    },
    [fetchAll]
  )

  const importHolidays = useCallback(
    async (holidays: { date: string; name: string }[]) => {
      try {
        setError(null)
        const count =
          await window.electronAPI.schoolEventImportHolidays(holidays)
        await fetchAll()
        return count
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "祝日の一括登録に失敗しました"
        )
        throw err
      }
    },
    [fetchAll]
  )

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return {
    events,
    loading,
    error,
    fetchAll,
    fetchByDateRange,
    createEvent,
    updateEvent,
    deleteEvent,
    importHolidays,
  }
}
