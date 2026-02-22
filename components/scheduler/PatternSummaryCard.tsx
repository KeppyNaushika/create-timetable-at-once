"use client"

import { Check, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { TimetablePattern } from "@/types/common.types"

interface PatternSummaryCardProps {
  pattern: TimetablePattern
  isSelected: boolean
  onSelect: (id: string) => void
  onAdopt: (id: string) => void
  onDelete: (id: string) => void
}

export function PatternSummaryCard({
  pattern,
  isSelected,
  onSelect,
  onAdopt,
  onDelete,
}: PatternSummaryCardProps) {
  const statusLabels: Record<string, string> = {
    draft: "下書き",
    candidate: "候補",
    adopted: "採用",
  }

  const statusVariants: Record<string, "default" | "secondary" | "outline"> = {
    adopted: "default",
    candidate: "secondary",
    draft: "outline",
  }

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all",
        isSelected && "ring-primary ring-2",
        pattern.status === "adopted" && "border-primary"
      )}
      onClick={() => onSelect(pattern.id)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm">
              {pattern.name || "無題パターン"}
            </CardTitle>
            <Badge
              variant={statusVariants[pattern.status] ?? "outline"}
              className="mt-1"
            >
              {statusLabels[pattern.status] ?? pattern.status}
            </Badge>
          </div>
          <div className="flex gap-1">
            {pattern.status !== "adopted" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation()
                  onAdopt(pattern.id)
                }}
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(pattern.id)
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div>
            <p className="text-lg font-bold">{pattern.violationCount}</p>
            <p className="text-muted-foreground text-xs">違反数</p>
          </div>
          <div>
            <p className="text-lg font-bold">{pattern.score.toFixed(0)}</p>
            <p className="text-muted-foreground text-xs">スコア</p>
          </div>
        </div>
        <p className="text-muted-foreground mt-2 text-xs">
          {new Date(pattern.createdAt).toLocaleString("ja-JP")}
        </p>
      </CardContent>
    </Card>
  )
}
