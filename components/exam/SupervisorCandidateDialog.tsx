"use client"

import { UserCheck } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { SupervisorCandidate } from "@/types/exam.types"

interface SupervisorCandidateDialogProps {
  open: boolean
  onClose: () => void
  candidates: SupervisorCandidate[]
  onSelect: (teacherId: string) => void
  date: string
  period: number
  className: string
  subjectName: string
}

export function SupervisorCandidateDialog({
  open,
  onClose,
  candidates,
  onSelect,
  date,
  period,
  className,
  subjectName,
}: SupervisorCandidateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            監督者の選択
          </DialogTitle>
          <DialogDescription>
            {date} {period}限 / {className} / {subjectName}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          <div className="space-y-2 pr-4">
            {candidates.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                候補者が見つかりません
              </p>
            )}
            {candidates.map((candidate) => (
              <button
                key={candidate.teacherId}
                type="button"
                className="flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                onClick={() => {
                  onSelect(candidate.teacherId)
                  onClose()
                }}
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {candidate.teacherName}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {candidate.score}点
                    </span>
                  </div>

                  <Progress value={candidate.score} className="h-1.5" />

                  <div className="flex flex-wrap gap-1">
                    {candidate.isSubjectTeacher && (
                      <Badge variant="default" className="text-xs">
                        教科担当
                      </Badge>
                    )}
                    {candidate.isSameSubjectTeacher && (
                      <Badge variant="secondary" className="text-xs">
                        同教科
                      </Badge>
                    )}
                    {candidate.isAvailable && (
                      <Badge variant="outline" className="text-xs">
                        空き
                      </Badge>
                    )}
                    {!candidate.isAvailable && (
                      <Badge variant="destructive" className="text-xs">
                        他予定あり
                      </Badge>
                    )}
                    {candidate.reasons.map((reason, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-xs"
                      >
                        {reason}
                      </Badge>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    現在の割当数: {candidate.currentAssignmentCount}回
                  </p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
