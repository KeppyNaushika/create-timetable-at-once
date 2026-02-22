"use client"

import { useCallback, useState } from "react"

export interface TeacherCapacityResult {
  id: string
  name: string
  maxPerDay: number
  maxPeriodsPerWeek: number
  maxConsecutive: number
  totalKomaCount: number
  unavailableCount: number
  dutyCount: number
  komaCount: number
}

export interface PeriodSummaryResult {
  dayOfWeek: number
  period: number
  availableTeachers: number
  requiredSlots: number
}

export function useKomaCheck() {
  const [teacherCapacity, setTeacherCapacity] = useState<
    TeacherCapacityResult[]
  >([])
  const [periodSummary, setPeriodSummary] = useState<PeriodSummaryResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTeacherCapacity = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await window.electronAPI.checkTeacherCapacity()
      setTeacherCapacity(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "容量チェックに失敗しました"
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPeriodSummary = useCallback(
    async (daysPerWeek: number, maxPeriods: number) => {
      try {
        setLoading(true)
        setError(null)
        const data = await window.electronAPI.checkPeriodSummary(
          daysPerWeek,
          maxPeriods
        )
        setPeriodSummary(data)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "時限サマリの取得に失敗しました"
        )
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    teacherCapacity,
    periodSummary,
    loading,
    error,
    fetchTeacherCapacity,
    fetchPeriodSummary,
  }
}
