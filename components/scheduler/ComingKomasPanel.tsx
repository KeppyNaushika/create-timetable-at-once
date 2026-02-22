"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { Koma } from "@/types/common.types"

import { KomaCard } from "./KomaCard"

interface ComingKomasPanelProps {
  candidates: { komaId: string; score: number }[]
  komaLookup: Record<string, Koma>
  onKomaSelect: (komaId: string) => void
}

export function ComingKomasPanel({
  candidates,
  komaLookup,
  onKomaSelect,
}: ComingKomasPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-3 py-2">
        <h3 className="text-sm font-semibold">来る駒</h3>
        <p className="text-muted-foreground text-xs">
          選択セルに配置可能な駒 ({candidates.length})
        </p>
      </div>
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {candidates.map(({ komaId, score }) => {
            const koma = komaLookup[komaId]
            if (!koma) return null
            return (
              <div
                key={komaId}
                className={cn(
                  "hover:bg-accent/50 flex cursor-pointer items-center gap-2 rounded p-1",
                  score === 0 && "bg-green-50"
                )}
                onClick={() => onKomaSelect(komaId)}
              >
                <div className="flex-1">
                  <KomaCard koma={koma} showTeacher />
                </div>
                <span
                  className={cn(
                    "text-xs",
                    score === 0
                      ? "font-medium text-green-600"
                      : score > 100
                        ? "text-destructive"
                        : "text-muted-foreground"
                  )}
                >
                  {score === 0 ? "最適" : `${score}`}
                </span>
              </div>
            )
          })}
          {candidates.length === 0 && (
            <p className="text-muted-foreground p-4 text-center text-xs">
              配置可能な駒がありません
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
