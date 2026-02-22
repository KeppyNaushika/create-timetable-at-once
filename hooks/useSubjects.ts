"use client"

import { useCallback, useEffect, useState } from "react"

import type { Subject } from "@/types/common.types"

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await window.electronAPI.subjectGetAll()
      setSubjects(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "科目一覧の取得に失敗しました"
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const createSubject = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        setError(null)
        const created = await window.electronAPI.subjectCreate(data)
        await fetchSubjects()
        return created
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "科目の作成に失敗しました"
        )
        throw err
      }
    },
    [fetchSubjects]
  )

  const updateSubject = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      try {
        setError(null)
        const updated = await window.electronAPI.subjectUpdate(id, data)
        await fetchSubjects()
        return updated
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "科目の更新に失敗しました"
        )
        throw err
      }
    },
    [fetchSubjects]
  )

  const deleteSubject = useCallback(
    async (id: string) => {
      try {
        setError(null)
        await window.electronAPI.subjectDelete(id)
        await fetchSubjects()
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "科目の削除に失敗しました"
        )
        throw err
      }
    },
    [fetchSubjects]
  )

  useEffect(() => {
    fetchSubjects()
  }, [fetchSubjects])

  const generalSubjects = subjects.filter((s) => s.category === "general")
  const reserveSubjects = subjects.filter((s) => s.category === "reserve")
  const schoolAffairSubjects = subjects.filter(
    (s) => s.category === "school_affair"
  )

  return {
    subjects,
    generalSubjects,
    reserveSubjects,
    schoolAffairSubjects,
    loading,
    error,
    fetchSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
  }
}
