"use client"

import { AlertTriangle, CalendarClock, Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
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
          <div className="text-muted-foreground flex items-center justify-center py-8">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            候補を検索中...
          </div>
        ) : proposals.length === 0 ? (
          <div className="text-muted-foreground py-6 text-center text-sm">
            振替候補が見つかりませんでした
          </div>
        ) : (
          <div className="space-y-2">
            {proposals.map((proposal, _i) => (
              <div
                key={`${proposal.targetDate}-${proposal.targetPeriod}`}
                className="hover:bg-accent/30 flex items-start gap-3 rounded-md border p-3 transition-colors"
              >
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {proposal.targetDate}（
                      {DAY_LABELS[proposal.targetDayOfWeek]}）
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {proposal.targetPeriod}時限
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={proposal.score} className="h-2 flex-1" />
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                      {proposal.score}点
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {proposal.reasons.map((reason, j) => (
                      <Badge
                        key={j}
                        variant="outline"
                        className="px-1.5 py-0 text-[10px]"
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
                          className="px-1.5 py-0 text-[10px]"
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
