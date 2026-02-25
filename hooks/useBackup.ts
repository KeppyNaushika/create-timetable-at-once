"use client"

import { useCallback, useEffect, useState } from "react"

interface BackupEntry {
  name: string
  path: string
  size: number
  date: string
}

export function useBackup() {
  const [backups, setBackups] = useState<BackupEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchList = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await window.electronAPI.backupGetList()
      setBackups(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "バックアップ一覧の取得に失敗しました"
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const createBackup = useCallback(async () => {
    try {
      setError(null)
      const result = await window.electronAPI.backupCreate()
      if (!result.success) {
        throw new Error(result.error ?? "バックアップの作成に失敗しました")
      }
      await fetchList()
      return result
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "バックアップの作成に失敗しました"
      )
      throw err
    }
  }, [fetchList])

  const restoreBackup = useCallback(async (path: string) => {
    try {
      setError(null)
      const result = await window.electronAPI.backupRestore(path)
      if (!result.success) {
        throw new Error(result.error ?? "バックアップの復元に失敗しました")
      }
      return result
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "バックアップの復元に失敗しました"
      )
      throw err
    }
  }, [])

  const deleteBackup = useCallback(
    async (path: string) => {
      try {
        setError(null)
        const result = await window.electronAPI.backupDelete(path)
        if (!result.success) {
          throw new Error(result.error ?? "バックアップの削除に失敗しました")
        }
        await fetchList()
        return result
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "バックアップの削除に失敗しました"
        )
        throw err
      }
    },
    [fetchList]
  )

  useEffect(() => {
    fetchList()
  }, [fetchList])

  return {
    backups,
    loading,
    error,
    fetchList,
    createBackup,
    restoreBackup,
    deleteBackup,
  }
}
