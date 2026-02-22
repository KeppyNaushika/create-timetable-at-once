"use client"

import {
  Eraser,
  LayoutGrid,
  Redo2,
  Save,
  Undo2,
  User,
  Building2,
  GraduationCap,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ViewMode } from "@/types/timetable.types"

interface ManualToolbarProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  violationCount: number
  errorCount: number
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
  onSave: () => void
  // Entity selector
  entities: { id: string; name: string }[]
  selectedEntity: string | null
  onEntityChange: (id: string | null) => void
}

const viewModeIcons: Record<ViewMode, React.ReactNode> = {
  teacher: <User className="h-4 w-4" />,
  class: <GraduationCap className="h-4 w-4" />,
  room: <Building2 className="h-4 w-4" />,
}

const viewModeLabels: Record<ViewMode, string> = {
  teacher: "先生別",
  class: "クラス別",
  room: "教室別",
}

export function ManualToolbar({
  viewMode,
  onViewModeChange,
  violationCount,
  errorCount,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onSave,
  entities,
  selectedEntity,
  onEntityChange,
}: ManualToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2">
      {/* View mode toggle */}
      <div className="flex items-center gap-1 rounded-md border p-0.5">
        {(["teacher", "class", "room"] as ViewMode[]).map((mode) => (
          <Button
            key={mode}
            variant={viewMode === mode ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => onViewModeChange(mode)}
          >
            {viewModeIcons[mode]}
            {viewModeLabels[mode]}
          </Button>
        ))}
      </div>

      {/* Entity selector */}
      <Select
        value={selectedEntity ?? ""}
        onValueChange={(v) => onEntityChange(v || null)}
      >
        <SelectTrigger className="h-8 w-40">
          <SelectValue placeholder="選択..." />
        </SelectTrigger>
        <SelectContent>
          {entities.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex-1" />

      {/* Violations badge */}
      {violationCount > 0 && (
        <Badge variant={errorCount > 0 ? "destructive" : "secondary"}>
          {errorCount > 0 ? `${errorCount}エラー` : `${violationCount}警告`}
        </Badge>
      )}

      {/* Undo/Redo */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={!canUndo}
        onClick={onUndo}
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={!canRedo}
        onClick={onRedo}
      >
        <Redo2 className="h-4 w-4" />
      </Button>

      {/* Clear */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1 text-xs"
        onClick={onClear}
      >
        <Eraser className="h-4 w-4" />
        クリア
      </Button>

      {/* Save */}
      <Button size="sm" className="h-8 gap-1 text-xs" onClick={onSave}>
        <Save className="h-4 w-4" />
        保存
      </Button>
    </div>
  )
}
