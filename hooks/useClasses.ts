"use client"

import { useCallback, useEffect, useState } from "react"

import type { ClassInfo, Grade } from "@/types/common.types"

export function useClasses() {
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const classData = await window.electronAPI.classGetAll()
      setClasses(classData)
      const gradeData = await window.electronAPI.gradeGetAll()
      setGrades(gradeData)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "クラス一覧の取得に失敗しました"
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const updateClass = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      try {
        setError(null)
        const updated = await window.electronAPI.classUpdate(id, data)
        await fetchClasses()
        return updated
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "クラスの更新に失敗しました"
        )
        throw err
      }
    },
    [fetchClasses]
  )

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  // 学年別にグループ化
  const classesByGrade = grades.map((grade) => ({
    grade,
    classes: classes.filter((c) => c.gradeId === grade.id),
  }))

  return {
    classes,
    grades,
    classesByGrade,
    loading,
    error,
    fetchClasses,
    updateClass,
  }
}
