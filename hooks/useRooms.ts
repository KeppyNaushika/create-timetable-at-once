"use client"

import { useCallback, useEffect, useState } from "react"

import type { SpecialRoom } from "@/types/common.types"

export function useRooms() {
  const [rooms, setRooms] = useState<SpecialRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await window.electronAPI.roomGetAll()
      setRooms(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "特別教室一覧の取得に失敗しました"
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const createRoom = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        setError(null)
        const created = await window.electronAPI.roomCreate(data)
        await fetchRooms()
        return created
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "特別教室の追加に失敗しました"
        )
        throw err
      }
    },
    [fetchRooms]
  )

  const updateRoom = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      try {
        setError(null)
        const updated = await window.electronAPI.roomUpdate(id, data)
        await fetchRooms()
        return updated
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "特別教室の更新に失敗しました"
        )
        throw err
      }
    },
    [fetchRooms]
  )

  const deleteRoom = useCallback(
    async (id: string) => {
      try {
        setError(null)
        await window.electronAPI.roomDelete(id)
        await fetchRooms()
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "特別教室の削除に失敗しました"
        )
        throw err
      }
    },
    [fetchRooms]
  )

  const upsertAvailability = useCallback(
    async (data: {
      roomId: string
      dayOfWeek: number
      period: number
      status: string
    }) => {
      try {
        setError(null)
        await window.electronAPI.roomAvailabilityUpsert(data)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "都合の更新に失敗しました"
        )
        throw err
      }
    },
    []
  )

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  return {
    rooms,
    loading,
    error,
    fetchRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    upsertAvailability,
  }
}
