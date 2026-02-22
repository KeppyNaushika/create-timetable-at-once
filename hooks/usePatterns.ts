"use client"

import { useCallback, useEffect, useState } from "react"

import type { TimetablePattern } from "@/types/common.types"

export function usePatterns() {
  const [patterns, setPatterns] = useState<TimetablePattern[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPatterns = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await window.electronAPI.patternGetAll()
      setPatterns(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "パターンの取得に失敗しました"
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const createPattern = useCallback(
    async (data: { name?: string; status?: string }) => {
      try {
        setError(null)
        const created = await window.electronAPI.patternCreate(data)
        setPatterns((prev) => [created, ...prev])
        return created
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "パターンの作成に失敗しました"
        )
        throw err
      }
    },
    []
  )

  const deletePattern = useCallback(async (id: string) => {
    try {
      setError(null)
      await window.electronAPI.patternDelete(id)
      setPatterns((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "パターンの削除に失敗しました"
      )
      throw err
    }
  }, [])

  const adoptPattern = useCallback(async (id: string) => {
    try {
      setError(null)
      const adopted = await window.electronAPI.patternAdopt(id)
      setPatterns((prev) =>
        prev.map((p) =>
          p.id === id
            ? adopted
            : p.status === "adopted"
              ? { ...p, status: "candidate" }
              : p
        )
      )
      return adopted
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "パターンの採用に失敗しました"
      )
      throw err
    }
  }, [])

  useEffect(() => {
    fetchPatterns()
  }, [fetchPatterns])

  return {
    patterns,
    loading,
    error,
    fetchPatterns,
    createPattern,
    deletePattern,
    adoptPattern,
  }
}
