"use client"

import { UserCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
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
    <div className="hover:bg-accent/30 flex items-center gap-3 rounded-md border p-3 transition-colors">
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{candidate.teacherName}</span>
          {candidate.isSameSubject && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              同教科
            </Badge>
          )}
          {!candidate.isAvailable && (
            <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
              要確認
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Progress value={candidate.score} className="h-2 flex-1" />
          <span className="text-muted-foreground text-xs whitespace-nowrap">
            {candidate.score}点
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {candidate.reasons.map((reason, i) => (
            <Badge
              key={i}
              variant="outline"
              className="px-1.5 py-0 text-[10px]"
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
