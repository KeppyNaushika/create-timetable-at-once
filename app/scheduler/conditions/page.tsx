"use client"

import { useEffect } from "react"
import { toast } from "sonner"

import { ConditionTable } from "@/components/scheduler/ConditionTable"
import { PerSubjectDialog } from "@/components/scheduler/PerSubjectDialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useConditions } from "@/hooks/useConditions"
import { useSubjects } from "@/hooks/useSubjects"

export default function ConditionsPage() {
  const {
    condition,
    loading,
    error,
    upsertCondition,
    upsertPerSubject,
    deletePerSubject,
  } = useConditions()
  const { subjects, fetchSubjects } = useSubjects()

  useEffect(() => {
    fetchSubjects()
  }, [fetchSubjects])

  // 初回表示時にデフォルト制約条件を作成
  useEffect(() => {
    if (!loading && !condition) {
      upsertCondition({}).catch(() => {})
    }
  }, [loading, condition, upsertCondition])

  const handleUpdate = async (data: Record<string, unknown>) => {
    try {
      await upsertCondition(data)
      toast.success("制約条件を更新しました")
    } catch {
      toast.error("制約条件の更新に失敗しました")
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (!condition) return null

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">処理条件設定</h1>
        <p className="text-muted-foreground mt-1">
          時間割作成時の制約条件とその重みを設定します
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>制約条件一覧</CardTitle>
              <CardDescription>
                各制約のレベル（禁止/考慮/無視）と重み（0-100）を設定してください
              </CardDescription>
            </div>
            <PerSubjectDialog
              conditionId={condition.id}
              subjects={subjects}
              perSubjectConditions={condition.perSubjectConditions ?? []}
              onUpsert={upsertPerSubject}
              onDelete={deletePerSubject}
            />
          </div>
        </CardHeader>
        <CardContent>
          <ConditionTable condition={condition} onUpdate={handleUpdate} />
        </CardContent>
      </Card>
    </div>
  )
}
