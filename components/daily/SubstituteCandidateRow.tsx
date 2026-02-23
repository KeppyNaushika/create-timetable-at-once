"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { UserCheck } from "lucide-react"
import type { SubstituteCandidate } from "@/types/daily.types"

interface SubstituteCandidateRowProps {
  candidate: SubstituteCandidate
  onSelect: (teacherId: string) => void
}

export function SubstituteCandidateRow({
  candidate,
  onSelect,
}: SubstituteCandidateRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-accent/30">
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{candidate.teacherName}</span>
          {candidate.isSameSubject && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              同教科
            </Badge>
          )}
          {!candidate.isAvailable && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              要確認
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Progress value={candidate.score} className="h-2 flex-1" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {candidate.score}点
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {candidate.reasons.map((reason, i) => (
            <Badge
              key={i}
              variant="outline"
              className="text-[10px] px-1.5 py-0"
            >
              {reason}
            </Badge>
          ))}
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onSelect(candidate.teacherId)}
      >
        <UserCheck className="mr-1 h-3.5 w-3.5" />
        選択
      </Button>
    </div>
  )
}
