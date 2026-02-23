"use client"

import { useState, useCallback, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DiagnosisScoreCard } from "@/components/review/DiagnosisScoreCard"
import { OverallGradeBadge } from "@/components/review/OverallGradeBadge"
import { useTimetableData } from "@/hooks/useTimetableData"
import { runDiagnosis } from "@/lib/diagnosis"
import type { DiagnosisResult } from "@/types/review.types"
import type { ScheduleCondition } from "@/types/common.types"
import { Loader2, RefreshCw } from "lucide-react"

export default function DiagnosisPage() {
  const { data, loading, error } = useTimetableData()
  const [result, setResult] = useState<DiagnosisResult | null>(null)
  const [diagnosing, setDiagnosing] = useState(false)
  const [condition, setCondition] = useState<ScheduleCondition | null>(null)

  useEffect(() => {
    async function loadCondition() {
      try {
        const cond = await window.electronAPI.conditionGet()
        setCondition(cond)
      } catch {
        // デフォルト条件を使用
      }
    }
    loadCondition()
  }, [])

  const handleDiagnose = useCallback(async () => {
    if (!data.school || !data.adoptedPattern || !condition) return

    setDiagnosing(true)
    try {
      // 非同期的に診断実行（UIブロック回避のためsetTimeoutで遅延）
      await new Promise((resolve) => setTimeout(resolve, 50))
      const diagResult = runDiagnosis({
        school: data.school,
        teachers: data.teachers,
        classes: data.classes,
        subjects: data.subjects,
        rooms: data.rooms,
        duties: data.duties,
        komas: data.komas,
        slots: data.slots,
        condition,
      })
      setResult(diagResult)
    } catch (err) {
      console.error("診断エラー:", err)
    } finally {
      setDiagnosing(false)
    }
  }, [data, condition])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-destructive">
        エラー: {error}
      </div>
    )
  }

  if (!data.adoptedPattern) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        採用済みの時間割パターンがありません。
        <br />
        先に時間割を作成し、パターンを採用してください。
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">品質診断</h1>
          <p className="text-sm text-muted-foreground">
            採用パターンの品質を5カテゴリで診断します
          </p>
        </div>
        <Button
          onClick={handleDiagnose}
          disabled={diagnosing || !condition}
        >
          {diagnosing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {result ? "再診断" : "診断実行"}
        </Button>
      </div>

      {!result && !diagnosing && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              「診断実行」ボタンを押して品質診断を開始してください
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              パターン: {data.adoptedPattern.name} / スロット数: {data.slots.length}
            </p>
          </CardContent>
        </Card>
      )}

      {result && (
        <>
          <div className="grid gap-4 md:grid-cols-[200px_1fr]">
            <OverallGradeBadge
              grade={result.overallGrade}
              score={result.overallScore}
            />

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">診断サマリ</CardTitle>
                <CardDescription>
                  {new Date(result.timestamp).toLocaleString("ja-JP")} に実行
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>制約違反数:</div>
                  <div className="font-medium">{result.totalViolations}件</div>
                  <div>配置スロット数:</div>
                  <div className="font-medium">{data.slots.length}件</div>
                  <div>対象先生数:</div>
                  <div className="font-medium">{data.teachers.length}名</div>
                  <div>対象クラス数:</div>
                  <div className="font-medium">{data.classes.length}クラス</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {result.categories.map((cat) => (
              <DiagnosisScoreCard key={cat.category} diagnosis={cat} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
