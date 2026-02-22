"use client"

import { Play, Square } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { SolverConfigPanel } from "@/components/scheduler/SolverConfigPanel"
import { SolverProgressBar } from "@/components/scheduler/SolverProgress"
import { SolverResultSummary } from "@/components/scheduler/SolverResultSummary"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useConditions } from "@/hooks/useConditions"
import { useKomas } from "@/hooks/useKomas"
import { usePatterns } from "@/hooks/usePatterns"
import { useSchool } from "@/hooks/useSchool"
import { useSolver } from "@/hooks/useSolver"
import { useTeachers } from "@/hooks/useTeachers"
import { useClasses } from "@/hooks/useClasses"
import { useRooms } from "@/hooks/useRooms"
import { useDuties } from "@/hooks/useDuties"
import { DEFAULT_SOLVER_CONFIG } from "@/lib/solver/types"
import type { SolverConfig, SolverInput } from "@/lib/solver/types"

export default function AutoPage() {
  const { school } = useSchool()
  const { komas, fetchKomas } = useKomas()
  const { teachers, fetchTeachers } = useTeachers()
  const { classes, fetchClasses } = useClasses()
  const { rooms, fetchRooms } = useRooms()
  const { duties, fetchDuties } = useDuties()
  const { condition, fetchCondition } = useConditions()
  const { createPattern } = usePatterns()
  const solver = useSolver()

  const [config, setConfig] = useState<SolverConfig>(DEFAULT_SOLVER_CONFIG)

  useEffect(() => {
    fetchKomas()
    fetchTeachers()
    fetchClasses()
    fetchRooms()
    fetchDuties()
    fetchCondition()
  }, [
    fetchKomas,
    fetchTeachers,
    fetchClasses,
    fetchRooms,
    fetchDuties,
    fetchCondition,
  ])

  const handleStart = useCallback(async () => {
    if (!school || !condition) {
      toast.error("学校設定と制約条件が必要です")
      return
    }

    if (komas.length === 0) {
      toast.error("駒が登録されていません")
      return
    }

    const input: SolverInput = {
      school,
      grades: [],
      classes,
      teachers,
      subjects: [],
      rooms,
      duties,
      komas,
      condition,
      fixedSlots: [],
    }

    solver.start(input, config)
    toast.success("ソルバーを開始しました")
  }, [
    school,
    condition,
    komas,
    teachers,
    classes,
    rooms,
    duties,
    config,
    solver,
  ])

  const handleSaveResult = useCallback(async () => {
    if (!solver.result) return

    try {
      const pattern = await createPattern({
        name: `自動作成 ${new Date().toLocaleString("ja-JP")}`,
        status: "candidate",
      })

      // Save assignments to pattern
      const slots = solver.result.assignments.map((a) => ({
        komaId: a.komaId,
        dayOfWeek: a.dayOfWeek,
        period: a.period,
        placedBy: "auto",
      }))

      await window.electronAPI.timetableBatchPlace(pattern.id, slots)
      await window.electronAPI.patternUpdateScore(pattern.id, {
        violationCount: solver.result.violations.length,
        score: solver.result.score,
      })

      toast.success("パターンを保存しました")
    } catch {
      toast.error("保存に失敗しました")
    }
  }, [solver.result, createPattern])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">自動時間割作成</h1>
        <p className="text-muted-foreground mt-1">
          CSPソルバーで時間割を自動生成します
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>ソルバー設定</CardTitle>
            <CardDescription>
              パラメータを調整して最適な結果を得てください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SolverConfigPanel config={config} onChange={setConfig} />
          </CardContent>
        </Card>

        <div className="flex gap-2">
          {!solver.isRunning ? (
            <Button onClick={handleStart} className="gap-2">
              <Play className="h-4 w-4" />
              自動作成開始
            </Button>
          ) : (
            <Button
              onClick={solver.abort}
              variant="destructive"
              className="gap-2"
            >
              <Square className="h-4 w-4" />
              中断
            </Button>
          )}
        </div>

        <SolverProgressBar
          progress={solver.progress}
          isRunning={solver.isRunning}
        />

        {solver.error && (
          <Card className="border-destructive">
            <CardContent className="pt-4">
              <p className="text-destructive text-sm">{solver.error}</p>
            </CardContent>
          </Card>
        )}

        {solver.result && (
          <>
            <SolverResultSummary result={solver.result} />
            <Button onClick={handleSaveResult} className="gap-2">
              結果を保存
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
