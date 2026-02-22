"use client"

import { useCallback, useEffect, useState } from "react"

import type { Duty } from "@/types/common.types"

export function useDuties() {
  const [duties, setDuties] = useState<Duty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDuties = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await window.electronAPI.dutyGetAll()
      setDuties(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "校務一覧の取得に失敗しました"
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const createDuty = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        setError(null)
        const created = await window.electronAPI.dutyCreate(data)
        await fetchDuties()
        return created
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "校務の追加に失敗しました"
        )
        throw err
      }
    },
    [fetchDuties]
  )

  const updateDuty = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      try {
        setError(null)
        const updated = await window.electronAPI.dutyUpdate(id, data)
        await fetchDuties()
        return updated
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "校務の更新に失敗しました"
        )
        throw err
      }
    },
    [fetchDuties]
  )

  const deleteDuty = useCallback(
    async (id: string) => {
      try {
        setError(null)
        await window.electronAPI.dutyDelete(id)
        await fetchDuties()
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "校務の削除に失敗しました"
        )
        throw err
      }
    },
    [fetchDuties]
  )

  const setTeachersForDuty = useCallback(
    async (dutyId: string, teacherIds: string[]) => {
      try {
        setError(null)
        await window.electronAPI.dutySetTeachers(dutyId, teacherIds)
        await fetchDuties()
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "担当先生の設定に失敗しました"
        )
        throw err
      }
    },
    [fetchDuties]
  )

  useEffect(() => {
    fetchDuties()
  }, [fetchDuties])

  return {
    duties,
    loading,
    error,
    fetchDuties,
    createDuty,
    updateDuty,
    deleteDuty,
    setTeachersForDuty,
  }
}
