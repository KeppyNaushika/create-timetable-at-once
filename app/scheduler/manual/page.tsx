"use client"

import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { DragOverlay } from "@/components/scheduler/DragOverlay"
import { ManualToolbar } from "@/components/scheduler/ManualToolbar"
import { RemainingKomaList } from "@/components/scheduler/RemainingKomaList"
import { TimetableGrid } from "@/components/scheduler/TimetableGrid"
import { ViolationsPane } from "@/components/scheduler/ViolationsPane"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useKomas } from "@/hooks/useKomas"
import { usePatterns } from "@/hooks/usePatterns"
import { useSchool } from "@/hooks/useSchool"
import { useTeachers } from "@/hooks/useTeachers"
import { useClasses } from "@/hooks/useClasses"
import { useRooms } from "@/hooks/useRooms"
import { useTimetable } from "@/hooks/useTimetable"
import { useTimetableEditor } from "@/hooks/useTimetableEditor"
import type { Koma } from "@/types/common.types"
import type { ViewMode } from "@/types/timetable.types"
import type { Violation } from "@/lib/solver/types"

export default function ManualPage() {
  const { school } = useSchool()
  const { komas, fetchKomas } = useKomas()
  const { teachers, fetchTeachers } = useTeachers()
  const { classes, fetchClasses } = useClasses()
  const { rooms, fetchRooms } = useRooms()
  const { patterns, createPattern } = usePatterns()
  const [activePatternId, setActivePatternId] = useState<string | null>(null)
  const {
    slots,
    fetchSlots,
    placeSlot,
    removeSlot,
    fixSlot,
    clearSlots,
    batchPlace,
  } = useTimetable(activePatternId)
  const editor = useTimetableEditor()

  const [viewMode, setViewMode] = useState<ViewMode>("teacher")
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null)
  const [selectedCell, setSelectedCell] = useState<{
    dayOfWeek: number
    period: number
  } | null>(null)
  const [activeKoma, setActiveKoma] = useState<Koma | null>(null)
  const [violations, setViolations] = useState<Violation[]>([])

  // Initial data fetch
  useEffect(() => {
    fetchKomas()
    fetchTeachers()
    fetchClasses()
    fetchRooms()
  }, [fetchKomas, fetchTeachers, fetchClasses, fetchRooms])

  // Create or select first pattern
  useEffect(() => {
    if (patterns.length > 0 && !activePatternId) {
      setActivePatternId(patterns[0].id)
    }
  }, [patterns, activePatternId])

  // Load slots when pattern changes
  useEffect(() => {
    if (activePatternId) {
      fetchSlots()
    }
  }, [activePatternId, fetchSlots])

  // Sync DB slots to editor
  useEffect(() => {
    editor.load(slots)
  }, [slots]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select first entity
  useEffect(() => {
    if (!selectedEntity) {
      const entities = getEntities()
      if (entities.length > 0) {
        setSelectedEntity(entities[0].id)
      }
    }
  }, [viewMode, teachers, classes, rooms]) // eslint-disable-line react-hooks/exhaustive-deps

  // Koma lookup
  const komaLookup = useMemo(() => {
    const map: Record<string, Koma> = {}
    for (const k of komas) {
      map[k.id] = k
    }
    return map
  }, [komas])

  // Entity list based on view mode
  function getEntities(): { id: string; name: string }[] {
    switch (viewMode) {
      case "teacher":
        return teachers.map((t) => ({ id: t.id, name: t.name }))
      case "class":
        return classes.map((c) => ({
          id: c.id,
          name: `${c.grade?.name ?? ""}${c.name}`,
        }))
      case "room":
        return rooms.map((r) => ({ id: r.id, name: r.name }))
      default:
        return []
    }
  }

  // Violation map for grid
  const violationMap = useMemo(() => {
    const map: Record<
      string,
      { message: string; severity: "error" | "warning" }[]
    > = {}
    for (const v of violations) {
      if (v.dayOfWeek !== undefined && v.period !== undefined) {
        const key = `${v.dayOfWeek}-${v.period}`
        if (!map[key]) map[key] = []
        map[key].push({
          message: v.message,
          severity: v.severity as "error" | "warning",
        })
      }
    }
    return map
  }, [violations])

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const data = event.active.data.current
      if (data?.komaId) {
        setActiveKoma(komaLookup[data.komaId] ?? null)
      }
    },
    [komaLookup]
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveKoma(null)
      const { active, over } = event
      if (!over) return

      const activeData = active.data.current
      const overData = over.data.current
      if (!activeData?.komaId || !overData) return

      const { komaId, slotId } = activeData
      const { dayOfWeek, period } = overData

      if (slotId) {
        // Move existing slot
        editor.move(slotId, komaId, 0, 0, dayOfWeek, period)
      } else {
        // Place new koma
        try {
          const newSlot = await placeSlot({
            komaId,
            dayOfWeek,
            period,
            placedBy: "manual",
          })
          if (newSlot) {
            editor.place(komaId, dayOfWeek, period, newSlot.id)
          }
        } catch {
          toast.error("配置に失敗しました")
        }
      }
    },
    [placeSlot, editor]
  )

  const handleRemoveSlot = useCallback(
    async (slotId: string) => {
      try {
        await removeSlot(slotId)
        const slot = editor.state.slots.find((s) => s.id === slotId)
        if (slot) {
          editor.remove(slotId, slot.komaId, slot.dayOfWeek, slot.period)
        }
      } catch {
        toast.error("削除に失敗しました")
      }
    },
    [removeSlot, editor]
  )

  const handleFixSlot = useCallback(
    async (slotId: string, isFixed: boolean) => {
      try {
        await fixSlot(slotId, isFixed)
        editor.fix(slotId, isFixed)
      } catch {
        toast.error("固定設定に失敗しました")
      }
    },
    [fixSlot, editor]
  )

  const handleClear = useCallback(async () => {
    try {
      await clearSlots(true) // keep fixed
      editor.clear(true)
      toast.success("固定以外の駒をクリアしました")
    } catch {
      toast.error("クリアに失敗しました")
    }
  }, [clearSlots, editor])

  const handleSave = useCallback(async () => {
    if (!activePatternId) {
      // Create new pattern
      try {
        const pattern = await createPattern({
          name: `手動パターン ${new Date().toLocaleString("ja-JP")}`,
          status: "draft",
        })
        setActivePatternId(pattern.id)
        toast.success("パターンを保存しました")
      } catch {
        toast.error("パターンの保存に失敗しました")
      }
    } else {
      toast.success("保存しました")
    }
  }, [activePatternId, createPattern])

  const handleCellClick = useCallback((dayOfWeek: number, period: number) => {
    setSelectedCell({ dayOfWeek, period })
  }, [])

  const handleKomaClick = useCallback((komaId: string) => {
    // Select koma for placement
  }, [])

  const errorCount = violations.filter((v) => v.severity === "error").length

  return (
    <TooltipProvider>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-full flex-col">
          <ManualToolbar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            violationCount={violations.length}
            errorCount={errorCount}
            canUndo={editor.canUndo}
            canRedo={editor.canRedo}
            onUndo={editor.undo}
            onRedo={editor.redo}
            onClear={handleClear}
            onSave={handleSave}
            entities={getEntities()}
            selectedEntity={selectedEntity}
            onEntityChange={setSelectedEntity}
          />

          <div className="flex flex-1 overflow-hidden">
            {/* Main grid */}
            <div className="flex-1 overflow-auto p-2">
              <TimetableGrid
                slots={editor.state.slots}
                komaLookup={komaLookup}
                daysPerWeek={school?.daysPerWeek ?? 5}
                maxPeriodsPerDay={school?.maxPeriodsPerDay ?? 6}
                viewMode={viewMode}
                selectedEntity={selectedEntity}
                selectedCell={selectedCell}
                violationMap={violationMap}
                onCellClick={handleCellClick}
                onRemoveSlot={handleRemoveSlot}
                onFixSlot={handleFixSlot}
              />
            </div>

            {/* Right panel: remaining komas */}
            <div className="w-56 border-l">
              <RemainingKomaList
                komas={komas}
                slots={editor.state.slots}
                selectedKomaId={editor.state.selectedKomaId}
                onKomaClick={handleKomaClick}
              />
            </div>
          </div>

          {/* Bottom: violations */}
          <ViolationsPane violations={violations} />
        </div>

        <DragOverlay activeKoma={activeKoma} />
      </DndContext>
    </TooltipProvider>
  )
}
