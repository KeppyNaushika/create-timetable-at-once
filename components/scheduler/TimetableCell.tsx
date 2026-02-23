"use client"

import { useDroppable } from "@dnd-kit/core"
import { AlertTriangle } from "lucide-react"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { Koma, TimetableSlot } from "@/types/common.types"

import { KomaCard } from "./KomaCard"

interface TimetableCellProps {
  dayOfWeek: number
  period: number
  slots: TimetableSlot[]
  komaLookup: Record<string, Koma>
  violations: { message: string; severity: "error" | "warning" }[]
  isSelected: boolean
  onCellClick: (dayOfWeek: number, period: number) => void
  onRemoveSlot: (slotId: string) => void
  onFixSlot: (slotId: string, isFixed: boolean) => void
  compact?: boolean
  /** Override droppable ID to avoid collisions in all-class grid */
  cellId?: string
}

export function TimetableCell({
  dayOfWeek,
  period,
  slots,
  komaLookup,
  violations,
  isSelected,
  onCellClick,
  onRemoveSlot,
  onFixSlot,
  compact,
  cellId,
}: TimetableCellProps) {
  const droppableId = cellId ?? `cell-${dayOfWeek}-${period}`
  const { isOver, setNodeRef } = useDroppable({
    id: droppableId,
    data: { dayOfWeek, period },
  })

  const hasError = violations.some((v) => v.severity === "error")
  const hasWarning = violations.some((v) => v.severity === "warning")

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative border p-0.5 transition-colors",
        compact ? "min-h-[32px]" : "min-h-[48px]",
        isOver && "bg-primary/10",
        isSelected && "ring-primary ring-2",
        hasError && "bg-red-50 dark:bg-red-950/30",
        hasWarning && !hasError && "bg-yellow-50 dark:bg-yellow-950/30"
      )}
      onClick={() => onCellClick(dayOfWeek, period)}
    >
      {violations.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="absolute top-0.5 right-0.5 z-10">
              <AlertTriangle
                className={cn(
                  "h-3 w-3",
                  hasError ? "text-destructive" : "text-yellow-500"
                )}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {violations.map((v, i) => (
              <div key={i} className="text-xs">
                {v.message}
              </div>
            ))}
          </TooltipContent>
        </Tooltip>
      )}

      <div className="flex flex-col gap-0.5">
        {slots.map((slot) => {
          const koma = komaLookup[slot.komaId]
          if (!koma) return null
          return (
            <ContextMenu key={slot.id}>
              <ContextMenuTrigger>
                <KomaCard
                  koma={koma}
                  slotId={slot.id}
                  isFixed={slot.isFixed}
                  isCompact
                  showTeacher
                />
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => onRemoveSlot(slot.id)}>
                  削除
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => onFixSlot(slot.id, !slot.isFixed)}
                >
                  {slot.isFixed ? "固定解除" : "固定する"}
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          )
        })}
      </div>
    </div>
  )
}
