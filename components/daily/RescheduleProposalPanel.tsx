"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Loader2, CalendarClock, AlertTriangle } from "lucide-react"
import type { RescheduleProposal } from "@/types/daily.types"

interface RescheduleProposalPanelProps {
  proposals: RescheduleProposal[]
  onSelect: (proposal: RescheduleProposal) => void
  loading?: boolean
}

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const

export function RescheduleProposalPanel({
  proposals,
  onSelect,
  loading,
}: RescheduleProposalPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="h-4 w-4" />
          振替候補
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            候補を検索中...
          </div>
        ) : proposals.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            振替候補が見つかりませんでした
          </div>
        ) : (
          <div className="space-y-2">
            {proposals.map((proposal, i) => (
              <div
                key={`${proposal.targetDate}-${proposal.targetPeriod}`}
                className="flex items-start gap-3 rounded-md border p-3 transition-colors hover:bg-accent/30"
              >
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {proposal.targetDate}（
                      {DAY_LABELS[proposal.targetDayOfWeek]}）
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {proposal.targetPeriod}時限
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={proposal.score} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {proposal.score}点
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {proposal.reasons.map((reason, j) => (
                      <Badge
                        key={j}
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {reason}
                      </Badge>
                    ))}
                  </div>
                  {proposal.conflicts.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {proposal.conflicts.map((conflict, j) => (
                        <Badge
                          key={j}
                          variant="destructive"
                          className="text-[10px] px-1.5 py-0"
                        >
                          <AlertTriangle className="mr-0.5 h-2.5 w-2.5" />
                          {conflict}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelect(proposal)}
                >
                  選択
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
