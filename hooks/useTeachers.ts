"use client"

import { useCallback, useEffect, useState } from "react"

import type { Teacher } from "@/types/common.types"

export function useTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await window.electronAPI.teacherGetAll()
      setTeachers(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "先生一覧の取得に失敗しました"
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const createTeacher = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        setError(null)
        const created = await window.electronAPI.teacherCreate(data)
        await fetchTeachers()
        return created
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "先生の追加に失敗しました"
        )
        throw err
      }
    },
    [fetchTeachers]
  )

  const updateTeacher = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      try {
        setError(null)
        const updated = await window.electronAPI.teacherUpdate(id, data)
        await fetchTeachers()
        return updated
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "先生の更新に失敗しました"
        )
        throw err
      }
    },
    [fetchTeachers]
  )

  const deleteTeacher = useCallback(
    async (id: string) => {
      try {
        setError(null)
        await window.electronAPI.teacherDelete(id)
        await fetchTeachers()
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "先生の削除に失敗しました"
        )
        throw err
      }
    },
    [fetchTeachers]
  )

  const upsertAvailability = useCallback(
    async (data: {
      teacherId: string
      dayOfWeek: number
      period: number
      status: string
    }) => {
      try {
        setError(null)
        await window.electronAPI.teacherAvailabilityUpsert(data)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "都合の更新に失敗しました"
        )
        throw err
      }
    },
    []
  )

  const batchUpsertAvailabilities = useCallback(
    async (
      items: {
        teacherId: string
        dayOfWeek: number
        period: number
        status: string
      }[]
    ) => {
      try {
        setError(null)
        await window.electronAPI.teacherAvailabilityBatchUpsert(items)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "都合の一括更新に失敗しました"
        )
        throw err
      }
    },
    []
  )

  useEffect(() => {
    fetchTeachers()
  }, [fetchTeachers])

  return {
    teachers,
    loading,
    error,
    fetchTeachers,
    createTeacher,
    updateTeacher,
    deleteTeacher,
    upsertAvailability,
    batchUpsertAvailabilities,
  }
}
