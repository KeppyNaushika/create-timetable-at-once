"use client"

import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { SolverResult } from "@/lib/solver/types"

interface SolverResultSummaryProps {
  result: SolverResult
}

export function SolverResultSummary({ result }: SolverResultSummaryProps) {
  const errors = result.violations.filter((v) => v.severity === "error")
  const warnings = result.violations.filter((v) => v.severity === "warning")

  return (
    <div className="space-y-3 rounded border p-4">
      <div className="flex items-center gap-2">
        {result.isComplete ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="text-destructive h-5 w-5" />
        )}
        <span className="text-sm font-semibold">
          {result.isComplete
            ? "完全な解が見つかりました"
            : "部分的な解が見つかりました"}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3 text-center">
        <div>
          <p className="text-2xl font-bold">{result.assignments.length}</p>
          <p className="text-muted-foreground text-xs">配置済み</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{result.score}</p>
          <p className="text-muted-foreground text-xs">スコア</p>
        </div>
        <div>
          <p className="text-2xl font-bold">
            {(result.elapsedMs / 1000).toFixed(1)}
          </p>
          <p className="text-muted-foreground text-xs">秒</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{result.violations.length}</p>
          <p className="text-muted-foreground text-xs">違反</p>
        </div>
      </div>

      {result.violations.length > 0 && (
        <div className="flex gap-2">
          {errors.length > 0 && (
            <Badge variant="destructive">
              <XCircle className="mr-1 h-3 w-3" />
              {errors.length}件のエラー
            </Badge>
          )}
          {warnings.length > 0 && (
            <Badge variant="secondary">
              <AlertTriangle className="mr-1 h-3 w-3" />
              {warnings.length}件の警告
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
