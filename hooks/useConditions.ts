"use client"

import { useCallback, useEffect, useState } from "react"

import type { ScheduleCondition } from "@/types/common.types"

export function useConditions() {
  const [condition, setCondition] = useState<ScheduleCondition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCondition = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await window.electronAPI.conditionGet()
      setCondition(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "制約条件の取得に失敗しました"
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const upsertCondition = useCallback(async (data: Record<string, unknown>) => {
    try {
      setError(null)
      const updated = await window.electronAPI.conditionUpsert(data)
      setCondition(updated)
      return updated
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "制約条件の更新に失敗しました"
      )
      throw err
    }
  }, [])

  const upsertPerSubject = useCallback(
    async (data: {
      conditionId: string
      subjectId: string
      placementRestriction?: string
      maxPerDay?: number
    }) => {
      try {
        setError(null)
        await window.electronAPI.conditionUpsertPerSubject(data)
        await fetchCondition()
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "教科別条件の更新に失敗しました"
        )
        throw err
      }
    },
    [fetchCondition]
  )

  const deletePerSubject = useCallback(
    async (conditionId: string, subjectId: string) => {
      try {
        setError(null)
        await window.electronAPI.conditionDeletePerSubject(
          conditionId,
          subjectId
        )
        await fetchCondition()
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "教科別条件の削除に失敗しました"
        )
        throw err
      }
    },
    [fetchCondition]
  )

  useEffect(() => {
    fetchCondition()
  }, [fetchCondition])

  return {
    condition,
    loading,
    error,
    fetchCondition,
    upsertCondition,
    upsertPerSubject,
    deletePerSubject,
  }
}
