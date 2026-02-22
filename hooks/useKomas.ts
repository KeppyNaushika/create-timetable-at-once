"use client"

import { useCallback, useEffect, useState } from "react"

import type { Koma } from "@/types/common.types"

export function useKomas(gradeId?: string) {
  const [komas, setKomas] = useState<Koma[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchKomas = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = gradeId
        ? await window.electronAPI.komaGetByGradeId(gradeId)
        : await window.electronAPI.komaGetAll()
      setKomas(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "駒一覧の取得に失敗しました"
      )
    } finally {
      setLoading(false)
    }
  }, [gradeId])

  const createKoma = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        setError(null)
        const created = await window.electronAPI.komaCreate(data)
        await fetchKomas()
        return created
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "駒の追加に失敗しました"
        )
        throw err
      }
    },
    [fetchKomas]
  )

  const updateKoma = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      try {
        setError(null)
        const updated = await window.electronAPI.komaUpdate(id, data)
        await fetchKomas()
        return updated
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "駒の更新に失敗しました"
        )
        throw err
      }
    },
    [fetchKomas]
  )

  const deleteKoma = useCallback(
    async (id: string) => {
      try {
        setError(null)
        await window.electronAPI.komaDelete(id)
        await fetchKomas()
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "駒の削除に失敗しました"
        )
        throw err
      }
    },
    [fetchKomas]
  )

  const duplicateKoma = useCallback(
    async (id: string) => {
      try {
        setError(null)
        const duplicated = await window.electronAPI.komaDuplicate(id)
        await fetchKomas()
        return duplicated
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "駒のコピーに失敗しました"
        )
        throw err
      }
    },
    [fetchKomas]
  )

  const setKomaTeachers = useCallback(
    async (
      komaId: string,
      teachers: { teacherId: string; role: string }[]
    ) => {
      try {
        setError(null)
        await window.electronAPI.komaSetTeachers(komaId, teachers)
        await fetchKomas()
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "先生の設定に失敗しました"
        )
        throw err
      }
    },
    [fetchKomas]
  )

  const setKomaClasses = useCallback(
    async (komaId: string, classIds: string[]) => {
      try {
        setError(null)
        await window.electronAPI.komaSetClasses(komaId, classIds)
        await fetchKomas()
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "クラスの設定に失敗しました"
        )
        throw err
      }
    },
    [fetchKomas]
  )

  const setKomaRooms = useCallback(
    async (komaId: string, roomIds: string[]) => {
      try {
        setError(null)
        await window.electronAPI.komaSetRooms(komaId, roomIds)
        await fetchKomas()
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "教室の設定に失敗しました"
        )
        throw err
      }
    },
    [fetchKomas]
  )

  const batchCreateKomas = useCallback(
    async (komasData: Record<string, unknown>[]) => {
      try {
        setError(null)
        const created = await window.electronAPI.komaBatchCreate(komasData)
        await fetchKomas()
        return created
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "駒の一括作成に失敗しました"
        )
        throw err
      }
    },
    [fetchKomas]
  )

  const deleteKomasByGrade = useCallback(
    async (targetGradeId: string) => {
      try {
        setError(null)
        await window.electronAPI.komaDeleteByGradeId(targetGradeId)
        await fetchKomas()
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "駒の一括削除に失敗しました"
        )
        throw err
      }
    },
    [fetchKomas]
  )

  useEffect(() => {
    fetchKomas()
  }, [fetchKomas])

  return {
    komas,
    loading,
    error,
    fetchKomas,
    createKoma,
    updateKoma,
    deleteKoma,
    duplicateKoma,
    setKomaTeachers,
    setKomaClasses,
    setKomaRooms,
    batchCreateKomas,
    deleteKomasByGrade,
  }
}
