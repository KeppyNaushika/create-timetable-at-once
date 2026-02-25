"use client"

import { useCallback, useEffect, useState } from "react"

import type { ExamSchedule } from "@/types/exam.types"

export function useExamSchedule() {
  const [schedules, setSchedules] = useState<ExamSchedule[]>([])
  const [currentSchedule, setCurrentSchedule] = useState<ExamSchedule | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await window.electronAPI.examScheduleGetAll()
      setSchedules(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "考査日程一覧の取得に失敗しました"
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchById = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await window.electronAPI.examScheduleGetById(id)
      if (data) {
        const assignments =
          await window.electronAPI.examAssignmentGetByScheduleId(id)
        const scheduleWithAssignments: ExamSchedule = {
          ...data,
          assignments,
        }
        setCurrentSchedule(scheduleWithAssignments)
        return scheduleWithAssignments
      }
      setCurrentSchedule(null)
      return null
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "考査日程の取得に失敗しました"
      )
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const createSchedule = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        setError(null)
        const created = await window.electronAPI.examScheduleCreate(data)
        await fetchAll()
        return created
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "考査日程の作成に失敗しました"
        )
        throw err
      }
    },
    [fetchAll]
  )

  const updateSchedule = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      try {
        setError(null)
        const updated = await window.electronAPI.examScheduleUpdate(id, data)
        await fetchAll()
        return updated
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "考査日程の更新に失敗しました"
        )
        throw err
      }
    },
    [fetchAll]
  )

  const deleteSchedule = useCallback(
    async (id: string) => {
      try {
        setError(null)
        await window.electronAPI.examScheduleDelete(id)
        if (currentSchedule?.id === id) {
          setCurrentSchedule(null)
        }
        await fetchAll()
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "考査日程の削除に失敗しました"
        )
        throw err
      }
    },
    [fetchAll, currentSchedule]
  )

  const batchUpsertAssignments = useCallback(
    async (scheduleId: string, assignments: Record<string, unknown>[]) => {
      try {
        setError(null)
        const result = await window.electronAPI.examAssignmentBatchUpsert(
          scheduleId,
          assignments
        )
        return result
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "試験割当の一括更新に失敗しました"
        )
        throw err
      }
    },
    []
  )

  const clearAssignments = useCallback(async (scheduleId: string) => {
    try {
      setError(null)
      await window.electronAPI.examAssignmentClear(scheduleId)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "試験割当のクリアに失敗しました"
      )
      throw err
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return {
    schedules,
    currentSchedule,
    loading,
    error,
    fetchAll,
    fetchById,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    batchUpsertAssignments,
    clearAssignments,
  }
}
