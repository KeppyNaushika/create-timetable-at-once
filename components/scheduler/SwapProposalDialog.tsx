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
import type { SwapProposal } from "@/lib/solver/chainSwap"
import { cn } from "@/lib/utils"
import type { Koma } from "@/types/common.types"

interface SwapProposalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proposals: SwapProposal[]
  komaLookup: Record<string, Koma>
  onApply: (proposal: SwapProposal) => void
}

export function SwapProposalDialog({
  open,
  onOpenChange,
  proposals,
  komaLookup,
  onApply,
}: SwapProposalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>振替提案</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-96">
          <div className="space-y-2 p-2">
            {proposals.map((proposal, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded border p-3"
              >
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{proposal.description}</p>
                  <div className="space-y-0.5">
                    {proposal.chain.map((step, j) => {
                      const koma = komaLookup[step.komaId]
                      return (
                        <div
                          key={j}
                          className="flex items-center gap-1 text-xs"
                        >
                          <span
                            className="rounded px-1 text-white"
                            style={{
                              backgroundColor:
                                koma?.subject?.color ?? "#6B7280",
                            }}
                          >
                            {koma?.subject?.shortName ?? "?"}
                          </span>
                          {step.from.dayOfWeek >= 0 && (
                            <span className="text-muted-foreground">
                              {DAY_NAMES[step.from.dayOfWeek]}
                              {step.from.period}限
                            </span>
                          )}
                          <ArrowRight className="h-3 w-3" />
                          <span>
                            {DAY_NAMES[step.to.dayOfWeek]}
                            {step.to.period}限
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <p
                    className={cn(
                      "text-xs",
                      proposal.scoreDelta < 0
                        ? "text-green-600"
                        : "text-muted-foreground"
                    )}
                  >
                    スコア変化: {proposal.scoreDelta > 0 ? "+" : ""}
                    {proposal.scoreDelta}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onApply(proposal)}
                >
                  適用
                </Button>
              </div>
            ))}
            {proposals.length === 0 && (
              <p className="text-muted-foreground p-4 text-center text-sm">
                振替提案がありません
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
