"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { CategoryDiagnosis } from "@/types/review.types"
import { ChevronDown, ChevronUp } from "lucide-react"

interface DiagnosisScoreCardProps {
  diagnosis: CategoryDiagnosis
}

const gradeColors: Record<string, string> = {
  A: "text-green-600 bg-green-50 border-green-200",
  B: "text-blue-600 bg-blue-50 border-blue-200",
  C: "text-yellow-600 bg-yellow-50 border-yellow-200",
  D: "text-orange-600 bg-orange-50 border-orange-200",
  E: "text-red-600 bg-red-50 border-red-200",
}

const progressColors: Record<string, string> = {
  A: "[&>div]:bg-green-500",
  B: "[&>div]:bg-blue-500",
  C: "[&>div]:bg-yellow-500",
  D: "[&>div]:bg-orange-500",
  E: "[&>div]:bg-red-500",
}

export function DiagnosisScoreCard({ diagnosis }: DiagnosisScoreCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{diagnosis.label}</CardTitle>
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 text-xl font-bold ${gradeColors[diagnosis.grade]}`}
          >
            {diagnosis.grade}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <Progress
            value={diagnosis.score}
            className={`h-2 ${progressColors[diagnosis.grade]}`}
          />
          <span className="text-sm font-medium whitespace-nowrap">
            {diagnosis.score}点
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between text-sm"
          onClick={() => setExpanded(!expanded)}
        >
          詳細
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {expanded && (
          <div className="space-y-2 pt-1">
            {diagnosis.details.length > 0 && (
              <ul className="space-y-1 text-sm text-muted-foreground">
                {diagnosis.details.map((d, i) => (
                  <li key={i} className="pl-2 border-l-2 border-muted">
                    {d}
                  </li>
                ))}
              </ul>
            )}

            {diagnosis.suggestions.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  改善提案:
                </p>
                {diagnosis.suggestions.map((s, i) => (
                  <p
                    key={i}
                    className="text-sm text-primary pl-2 border-l-2 border-primary/30"
                  >
                    {s}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
