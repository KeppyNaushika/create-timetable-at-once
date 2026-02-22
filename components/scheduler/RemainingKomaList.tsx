"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import type { Koma, TimetableSlot } from "@/types/common.types"

import { KomaCard } from "./KomaCard"

interface RemainingKomaListProps {
  komas: Koma[]
  slots: TimetableSlot[]
  selectedKomaId: string | null
  onKomaClick: (komaId: string) => void
}

export function RemainingKomaList({
  komas,
  slots,
  selectedKomaId,
  onKomaClick,
}: RemainingKomaListProps) {
  // Count placed slots per koma
  const placedCounts: Record<string, number> = {}
  for (const slot of slots) {
    placedCounts[slot.komaId] = (placedCounts[slot.komaId] ?? 0) + 1
  }

  // Build remaining list
  const remaining = komas
    .map((koma) => {
      const placed = placedCounts[koma.id] ?? 0
      const remaining = koma.count - placed
      return { koma, remaining }
    })
    .filter((item) => item.remaining > 0)

  const totalRemaining = remaining.reduce((sum, r) => sum + r.remaining, 0)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h3 className="text-sm font-semibold">未配置の駒</h3>
        <span className="text-muted-foreground text-xs">
          {totalRemaining}個
        </span>
      </div>
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {remaining.map(({ koma, remaining: count }) => (
            <div
              key={koma.id}
              className="cursor-pointer"
              onClick={() => onKomaClick(koma.id)}
            >
              <div className="flex items-center gap-1">
                <div className="flex-1">
                  <KomaCard koma={koma} showTeacher />
                </div>
                <span className="text-muted-foreground text-xs">x{count}</span>
              </div>
            </div>
          ))}
          {remaining.length === 0 && (
            <p className="text-muted-foreground p-2 text-center text-xs">
              全ての駒が配置済みです
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
