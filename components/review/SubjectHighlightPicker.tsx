"use client"

import { X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HIGHLIGHT_COLORS } from "@/lib/constants"
import type { Subject } from "@/types/common.types"
import type { SubjectHighlight } from "@/types/review.types"

interface SubjectHighlightPickerProps {
  subjects: Subject[]
  highlights: SubjectHighlight[]
  onChange: (highlights: SubjectHighlight[]) => void
}

export function SubjectHighlightPicker({
  subjects,
  highlights,
  onChange,
}: SubjectHighlightPickerProps) {
  const addHighlight = (subjectId: string) => {
    if (highlights.length >= 4) return
    if (highlights.some((h) => h.subjectId === subjectId)) return
    const color = HIGHLIGHT_COLORS[highlights.length]
    onChange([...highlights, { subjectId, color }])
  }

  const removeHighlight = (subjectId: string) => {
    const updated = highlights.filter((h) => h.subjectId !== subjectId)
    // 色を詰め直す
    const recolored = updated.map((h, i) => ({
      ...h,
      color: HIGHLIGHT_COLORS[i],
    }))
    onChange(recolored)
  }

  const availableSubjects = subjects.filter(
    (s) =>
      s.category === "general" && !highlights.some((h) => h.subjectId === s.id)
  )

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-sm">ハイライト:</span>
      {highlights.map((h) => {
        const subject = subjects.find((s) => s.id === h.subjectId)
        return (
          <Badge
            key={h.subjectId}
            variant="outline"
            className="gap-1"
            style={{ borderColor: h.color, backgroundColor: `${h.color}20` }}
          >
            {subject?.shortName ?? subject?.name ?? "?"}
            <button
              onClick={() => removeHighlight(h.subjectId)}
              className="hover:text-destructive ml-1"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )
      })}
      {highlights.length < 4 && availableSubjects.length > 0 && (
        <select
          className="border-input bg-background h-7 rounded border px-2 text-sm"
          value=""
          onChange={(e) => {
            if (e.target.value) addHighlight(e.target.value)
          }}
        >
          <option value="">+ 追加</option>
          {availableSubjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}
      {highlights.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => onChange([])}
        >
          クリア
        </Button>
      )}
    </div>
  )
}
