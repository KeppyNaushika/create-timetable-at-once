"use client"

import { useCallback, useState } from "react"

import type { DailySchedule } from "@/types/daily.types"

export function useDailySchedule() {
  const [schedules, setSchedules] = useState<DailySchedule[]>([])
  const [currentSchedule, setCurrentSchedule] = useState<DailySchedule | null>(
    null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchByMonth = useCallback(async (yearMonth: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await window.electronAPI.dailyScheduleGetByMonth(yearMonth)
      setSchedules(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "日課一覧の取得に失敗しました"
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchByDate = useCallback(async (date: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await window.electronAPI.dailyScheduleGetByDate(date)
      setCurrentSchedule(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "日課の取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }, [])

  const upsertSchedule = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        setError(null)
        const result = await window.electronAPI.dailyScheduleUpsert(data)
        setCurrentSchedule(result)
        // Refresh the monthly list if we have schedules loaded
        if (schedules.length > 0) {
          const date = data.date as string
          const yearMonth = date.slice(0, 7)
          const refreshed =
            await window.electronAPI.dailyScheduleGetByMonth(yearMonth)
          setSchedules(refreshed)
        }
        return result
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "日課の保存に失敗しました"
        )
        throw err
      }
    },
    [schedules.length]
  )

  const deleteSchedule = useCallback(
    async (id: string) => {
      try {
        setError(null)
        await window.electronAPI.dailyScheduleDelete(id)
        setCurrentSchedule(null)
        // Refresh the monthly list if we have schedules loaded
        if (schedules.length > 0) {
          const deleted = schedules.find((s) => s.id === id)
          if (deleted) {
            const yearMonth = deleted.date.slice(0, 7)
            const refreshed =
              await window.electronAPI.dailyScheduleGetByMonth(yearMonth)
            setSchedules(refreshed)
          } else {
            setSchedules((prev) => prev.filter((s) => s.id !== id))
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "日課の削除に失敗しました"
        )
        throw err
      }
    },
    [schedules]
  )

  return {
    schedules,
    currentSchedule,
    loading,
    error,
    fetchByMonth,
    fetchByDate,
    upsertSchedule,
    deleteSchedule,
  }
}
