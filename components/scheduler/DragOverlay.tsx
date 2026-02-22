"use client"

import { DragOverlay as DndDragOverlay } from "@dnd-kit/core"

import type { Koma } from "@/types/common.types"

interface DragOverlayProps {
  activeKoma: Koma | null
}

export function DragOverlay({ activeKoma }: DragOverlayProps) {
  if (!activeKoma) return null

  const bgColor = activeKoma.subject?.color ?? "#6B7280"
  const shortName =
    activeKoma.subject?.shortName ||
    activeKoma.subject?.name?.slice(0, 2) ||
    "?"

  return (
    <DndDragOverlay>
      <div
        className="rounded border px-2 py-1 text-xs font-medium text-white shadow-lg"
        style={{ backgroundColor: bgColor }}
      >
        {shortName}
      </div>
    </DndDragOverlay>
  )
}
