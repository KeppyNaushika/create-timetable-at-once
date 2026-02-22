"use client"

import { useDraggable } from "@dnd-kit/core"

import { cn } from "@/lib/utils"
import type { Koma } from "@/types/common.types"

interface KomaCardProps {
  koma: Koma
  slotId?: string
  isFixed?: boolean
  isCompact?: boolean
  showTeacher?: boolean
}

export function KomaCard({
  koma,
  slotId,
  isFixed,
  isCompact,
  showTeacher,
}: KomaCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: slotId ? `slot-${slotId}` : `koma-${koma.id}`,
    data: {
      type: "koma",
      komaId: koma.id,
      slotId,
    },
    disabled: isFixed,
  })

  const bgColor = koma.subject?.color ?? "#6B7280"
  const shortName =
    koma.subject?.shortName || koma.subject?.name?.slice(0, 2) || "?"
  const teacherName =
    showTeacher && koma.komaTeachers?.[0]?.teacher?.name
      ? koma.komaTeachers[0].teacher.name
      : null

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-grab rounded border text-white shadow-sm transition-opacity select-none",
        isDragging && "opacity-40",
        isFixed && "cursor-default ring-2 ring-yellow-400",
        isCompact ? "px-1 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
      )}
      style={{ backgroundColor: bgColor }}
    >
      <div className="truncate font-medium">{shortName}</div>
      {teacherName && !isCompact && (
        <div className="truncate text-[10px] opacity-80">{teacherName}</div>
      )}
    </div>
  )
}
