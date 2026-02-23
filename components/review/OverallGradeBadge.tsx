"use client"

import type { DiagnosisGrade } from "@/types/review.types"

interface OverallGradeBadgeProps {
  grade: DiagnosisGrade
  score: number
}

const gradeStyles: Record<string, { bg: string; text: string; ring: string }> = {
  A: { bg: "bg-green-100", text: "text-green-700", ring: "ring-green-300" },
  B: { bg: "bg-blue-100", text: "text-blue-700", ring: "ring-blue-300" },
  C: { bg: "bg-yellow-100", text: "text-yellow-700", ring: "ring-yellow-300" },
  D: { bg: "bg-orange-100", text: "text-orange-700", ring: "ring-orange-300" },
  E: { bg: "bg-red-100", text: "text-red-700", ring: "ring-red-300" },
}

const gradeLabels: Record<string, string> = {
  A: "優秀",
  B: "良好",
  C: "普通",
  D: "要改善",
  E: "要修正",
}

export function OverallGradeBadge({ grade, score }: OverallGradeBadgeProps) {
  const style = gradeStyles[grade]

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl p-6 ring-2 ${style.bg} ${style.ring}`}
    >
      <div className={`text-6xl font-bold ${style.text}`}>{grade}</div>
      <div className={`mt-1 text-lg font-medium ${style.text}`}>
        {gradeLabels[grade]}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">
        総合スコア: {score}/100
      </div>
    </div>
  )
}
