"use client"

import { useCallback, useRef, useState } from "react"

import type { DailyChange } from "@/types/daily.types"

export function useDailyChanges() {
  const [changes, setChanges] = useState<DailyChange[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const currentScheduleIdRef = useRef<string | null>(null)

  const fetchChanges = useCallback(async (scheduleId: string) => {
    try {
      setLoading(true)
      setError(null)
      currentScheduleIdRef.current = scheduleId
      const data =
        await window.electronAPI.dailyChangeGetByScheduleId(scheduleId)
      setChanges(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "変更一覧の取得に失敗しました"
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshChanges = useCallback(async () => {
    if (currentScheduleIdRef.current) {
      const data = await window.electronAPI.dailyChangeGetByScheduleId(
        currentScheduleIdRef.current
      )
      setChanges(data)
    }
  }, [])

  const createChange = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        setError(null)
        const created = await window.electronAPI.dailyChangeCreate(data)
        await refreshChanges()
        return created
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "変更の追加に失敗しました"
        )
        throw err
      }
    },
    [refreshChanges]
  )

  const updateChange = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      try {
        setError(null)
        const updated = await window.electronAPI.dailyChangeUpdate(id, data)
        await refreshChanges()
        return updated
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "変更の更新に失敗しました"
        )
        throw err
      }
    },
    [refreshChanges]
  )

  const deleteChange = useCallback(
    async (id: string) => {
      try {
        setError(null)
        await window.electronAPI.dailyChangeDelete(id)
        await refreshChanges()
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "変更の削除に失敗しました"
        )
        throw err
      }
    },
    [refreshChanges]
  )

  return {
    changes,
    loading,
    error,
    fetchChanges,
    createChange,
    updateChange,
    deleteChange,
  }
}
