"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { DAY_NAMES } from "@/lib/constants"
import type { SlotPosition } from "@/lib/solver/types"
import { cn } from "@/lib/utils"

interface KomaDestinationsPanelProps {
  destinations: { pos: SlotPosition; score: number }[]
  onDestinationClick: (pos: SlotPosition) => void
}

export function KomaDestinationsPanel({
  destinations,
  onDestinationClick,
}: KomaDestinationsPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-3 py-2">
        <h3 className="text-sm font-semibold">駒の行き先</h3>
        <p className="text-muted-foreground text-xs">
          選択駒の配置可能場所 ({destinations.length})
        </p>
      </div>
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-0.5">
          {destinations.map(({ pos, score }) => (
            <div
              key={`${pos.dayOfWeek}-${pos.period}`}
              className={cn(
                "hover:bg-accent/50 flex cursor-pointer items-center justify-between rounded px-2 py-1 text-xs",
                score === 0 && "bg-green-50"
              )}
              onClick={() => onDestinationClick(pos)}
            >
              <span>
                {DAY_NAMES[pos.dayOfWeek]} {pos.period}限
              </span>
              <span
                className={cn(
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
          ))}
          {destinations.length === 0 && (
            <p className="text-muted-foreground p-4 text-center text-xs">
              配置可能な場所がありません
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
