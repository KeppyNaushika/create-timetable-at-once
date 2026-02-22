"use client"

import { useCallback, useState } from "react"

import type { TimetableSlot } from "@/types/common.types"

export function useTimetable(patternId: string | null) {
  const [slots, setSlots] = useState<TimetableSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSlots = useCallback(async () => {
    if (!patternId) return
    try {
      setLoading(true)
      setError(null)
      const pattern = await window.electronAPI.patternGetWithSlots(patternId)
      setSlots(pattern?.slots ?? [])
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "スロットの取得に失敗しました"
      )
    } finally {
      setLoading(false)
    }
  }, [patternId])

  const placeSlot = useCallback(
    async (data: {
      komaId: string
      dayOfWeek: number
      period: number
      placedBy?: string
    }) => {
      if (!patternId) return
      try {
        setError(null)
        const slot = await window.electronAPI.timetablePlace({
          patternId,
          ...data,
        })
        setSlots((prev) => [...prev, slot])
        return slot
      } catch (err) {
        setError(err instanceof Error ? err.message : "配置に失敗しました")
        throw err
      }
    },
    [patternId]
  )

  const removeSlot = useCallback(
    async (slotId: string) => {
      if (!patternId) return
      try {
        setError(null)
        await window.electronAPI.timetableRemove(patternId, slotId)
        setSlots((prev) => prev.filter((s) => s.id !== slotId))
      } catch (err) {
        setError(err instanceof Error ? err.message : "削除に失敗しました")
        throw err
      }
    },
    [patternId]
  )

  const fixSlot = useCallback(async (slotId: string, isFixed: boolean) => {
    try {
      setError(null)
      const updated = await window.electronAPI.timetableFix(slotId, isFixed)
      setSlots((prev) => prev.map((s) => (s.id === slotId ? updated : s)))
      return updated
    } catch (err) {
      setError(err instanceof Error ? err.message : "固定設定に失敗しました")
      throw err
    }
  }, [])

  const clearSlots = useCallback(
    async (keepFixed: boolean) => {
      if (!patternId) return
      try {
        setError(null)
        await window.electronAPI.timetableClear(patternId, keepFixed)
        if (keepFixed) {
          setSlots((prev) => prev.filter((s) => s.isFixed))
        } else {
          setSlots([])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "クリアに失敗しました")
        throw err
      }
    },
    [patternId]
  )

  const batchPlace = useCallback(
    async (
      slotData: {
        komaId: string
        dayOfWeek: number
        period: number
        placedBy?: string
      }[]
    ) => {
      if (!patternId) return
      try {
        setError(null)
        const newSlots = await window.electronAPI.timetableBatchPlace(
          patternId,
          slotData
        )
        setSlots((prev) => [...prev, ...newSlots])
        return newSlots
      } catch (err) {
        setError(err instanceof Error ? err.message : "一括配置に失敗しました")
        throw err
      }
    },
    [patternId]
  )

  return {
    slots,
    setSlots,
    loading,
    error,
    fetchSlots,
    placeSlot,
    removeSlot,
    fixSlot,
    clearSlots,
    batchPlace,
  }
}
