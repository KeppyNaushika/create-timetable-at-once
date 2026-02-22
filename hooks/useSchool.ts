"use client"

import { useCallback, useEffect, useState } from "react"

import type { School, SchoolWithGrades } from "@/types/common.types"

export function useSchool() {
  const [school, setSchool] = useState<School | null>(null)
  const [schoolWithGrades, setSchoolWithGrades] =
    useState<SchoolWithGrades | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSchool = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await window.electronAPI.schoolGet()
      setSchool(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "学校情報の取得に失敗しました"
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSchoolWithGrades = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await window.electronAPI.schoolGetWithGrades()
      setSchoolWithGrades(data)
      if (data) {
        const { grades: _, ...schoolOnly } = data as SchoolWithGrades & {
          grades: unknown
        }
        setSchool(schoolOnly as School)
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "学校情報の取得に失敗しました"
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSchool = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      try {
        setError(null)
        const updated = await window.electronAPI.schoolUpdate(id, data)
        setSchool(updated)
        return updated
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "学校情報の更新に失敗しました"
        )
        throw err
      }
    },
    []
  )

  const createSchool = useCallback(async (data: Record<string, unknown>) => {
    try {
      setError(null)
      const created = await window.electronAPI.schoolCreate(data)
      setSchool(created)
      return created
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "学校情報の作成に失敗しました"
      )
      throw err
    }
  }, [])

  useEffect(() => {
    fetchSchool()
  }, [fetchSchool])

  return {
    school,
    schoolWithGrades,
    loading,
    error,
    fetchSchool,
    fetchSchoolWithGrades,
    createSchool,
    updateSchool,
  }
}
