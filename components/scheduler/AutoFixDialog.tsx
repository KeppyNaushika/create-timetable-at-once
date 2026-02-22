"use client"

import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DAY_NAMES } from "@/lib/constants"
import type { AutoFixSuggestion } from "@/lib/solver/autoFix"
import { cn } from "@/lib/utils"
import type { Koma } from "@/types/common.types"

interface AutoFixDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  suggestions: AutoFixSuggestion[]
  komaLookup: Record<string, Koma>
  onApply: (suggestion: AutoFixSuggestion) => void
  onApplyAll: () => void
}

export function AutoFixDialog({
  open,
  onOpenChange,
  suggestions,
  komaLookup,
  onApply,
  onApplyAll,
}: AutoFixDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>自動修正提案</DialogTitle>
            {suggestions.length > 0 && (
              <Button size="sm" onClick={onApplyAll}>
                全て適用
              </Button>
            )}
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-96">
          <div className="space-y-2 p-2">
            {suggestions.map((s, i) => {
              const koma = komaLookup[s.komaId]
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded border p-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className="rounded px-1.5 py-0.5 text-xs text-white"
                        style={{
                          backgroundColor: koma?.subject?.color ?? "#6B7280",
                        }}
                      >
                        {koma?.subject?.shortName ?? "?"}
                      </span>
                      <span className="text-muted-foreground">
                        {DAY_NAMES[s.currentPos.dayOfWeek]}
                        {s.currentPos.period}限
                      </span>
                      <ArrowRight className="h-3 w-3" />
                      <span>
                        {DAY_NAMES[s.suggestedPos.dayOfWeek]}
                        {s.suggestedPos.period}限
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">
                      違反 {s.removedViolations.length}件解消 →{" "}
                      {s.newViolations.length}件残
                    </p>
                    <p
                      className={cn(
                        "text-xs",
                        s.scoreDelta < 0
                          ? "text-green-600"
                          : "text-muted-foreground"
                      )}
                    >
                      スコア: {s.scoreDelta > 0 ? "+" : ""}
                      {s.scoreDelta}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onApply(s)}
                  >
                    適用
                  </Button>
                </div>
              )
            })}
            {suggestions.length === 0 && (
              <p className="text-muted-foreground p-4 text-center text-sm">
                自動修正の提案がありません
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
