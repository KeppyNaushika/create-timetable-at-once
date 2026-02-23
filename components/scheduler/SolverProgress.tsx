"use client"

import { Progress } from "@/components/ui/progress"
import type { SolverProgress as SolverProgressType } from "@/lib/solver/types"

interface SolverProgressProps {
  progress: SolverProgressType | null
  isRunning: boolean
}

export function SolverProgressBar({
  progress,
  isRunning,
}: SolverProgressProps) {
  if (!progress && !isRunning) return null

  const percentage = progress
    ? progress.totalKomas > 0
      ? Math.round((progress.placedCount / progress.totalKomas) * 100)
      : 0
    : 0

  return (
    <div className="space-y-2 rounded border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isRunning && (
            <div className="border-primary h-3 w-3 animate-spin rounded-full border-2 border-t-transparent" />
          )}
          <span className="text-sm font-medium">
            {progress?.phaseLabel ?? "準備中..."}
          </span>
        </div>
        <span className="text-muted-foreground text-xs">
          パターン {(progress?.patternIndex ?? 0) + 1}/
          {progress?.totalPatterns ?? 1}
        </span>
      </div>

      <Progress value={percentage} className="h-2" />

      <div className="text-muted-foreground flex justify-between text-xs">
        <span>
          {progress?.placedCount ?? 0}/{progress?.totalKomas ?? 0} 駒配置
        </span>
        {(progress?.score ?? 0) > 0 && (
          <span>最良スコア: {(progress?.score ?? 0).toLocaleString()}</span>
        )}
        <span>{((progress?.elapsedMs ?? 0) / 1000).toFixed(1)}秒</span>
      </div>

      {progress?.message && (
        <p className="text-muted-foreground text-xs">{progress.message}</p>
      )}
    </div>
  )
}
