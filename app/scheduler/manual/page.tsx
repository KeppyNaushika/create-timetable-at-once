"use client"

import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { DragOverlay } from "@/components/scheduler/DragOverlay"
import { ManualToolbar } from "@/components/scheduler/ManualToolbar"
import { RemainingKomaList } from "@/components/scheduler/RemainingKomaList"
import { TimetableGrid } from "@/components/scheduler/TimetableGrid"
import { ViolationsPane } from "@/components/scheduler/ViolationsPane"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useClasses } from "@/hooks/useClasses"
import { useConditions } from "@/hooks/useConditions"
import { useDuties } from "@/hooks/useDuties"
import { useKomas } from "@/hooks/useKomas"
import { usePatterns } from "@/hooks/usePatterns"
import { useRooms } from "@/hooks/useRooms"
import { useSchool } from "@/hooks/useSchool"
import { useTeachers } from "@/hooks/useTeachers"
import { useTimetable } from "@/hooks/useTimetable"
import { useTimetableEditor } from "@/hooks/useTimetableEditor"
import {
  type ConstraintContext,
  evaluateAllConstraints,
  setTeacherCache,
} from "@/lib/solver/constraints"
import type { Assignment, Violation } from "@/lib/solver/types"
import {
  buildDutyMap,
  buildKomaLookup,
  buildRoomAvailabilityMap,
  buildScheduleMaps,
  buildTeacherAvailabilityMap,
  parseDisabledSlots,
} from "@/lib/solver/utils"
import type { Koma } from "@/types/common.types"
import type { ViewMode } from "@/types/timetable.types"

export default function ManualPage() {
  const { school } = useSchool()
  const { komas, fetchKomas } = useKomas()
  const { teachers, fetchTeachers } = useTeachers()
  const { classes, grades: _grades, fetchClasses } = useClasses()
  const { rooms, fetchRooms } = useRooms()
  const { condition } = useConditions()
  const { duties } = useDuties()
  const { patterns, createPattern } = usePatterns()
  const [activePatternId, setActivePatternId] = useState<string | null>(null)
  const { slots, fetchSlots, placeSlot, removeSlot, fixSlot, clearSlots } =
    useTimetable(activePatternId)
  const editor = useTimetableEditor()

  const [viewMode, setViewMode] = useState<ViewMode>("all")
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
  }, [slots])

  // Auto-select first entity when in entity mode
  useEffect(() => {
    if (viewMode === "all") return
    if (!selectedEntity) {
      const entities = getEntities()
      if (entities.length > 0) {
        setSelectedEntity(entities[0].id)
      }
    }
  }, [viewMode, teachers, classes, rooms])

  // Disabled slots
  const disabledSlots = useMemo(
    () => parseDisabledSlots(school?.disabledSlotsJson ?? "[]"),
    [school?.disabledSlotsJson]
  )

  // Koma lookup (solver-style with teacherIds/classIds/roomIds)
  const komaLookupSolver = useMemo(() => buildKomaLookup(komas), [komas])

  // Koma lookup (simple for grid display)
  const komaLookup = useMemo(() => {
    const map: Record<string, Koma> = {}
    for (const k of komas) {
      map[k.id] = k
    }
    return map
  }, [komas])

  // --- Violation detection ---
  const violationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!condition || komas.length === 0) return

    if (violationTimerRef.current) clearTimeout(violationTimerRef.current)

    violationTimerRef.current = setTimeout(() => {
      try {
        // Set teacher cache for constraint checks
        setTeacherCache(teachers)

        // Build assignments from current editor slots
        const assignments: Assignment[] = editor.state.slots.map((s) => ({
          komaId: s.komaId,
          dayOfWeek: s.dayOfWeek,
          period: s.period,
        }))

        if (assignments.length === 0) {
          setViolations([])
          return
        }

        // Build context
        const teacherAvailMap = buildTeacherAvailabilityMap(teachers)
        const roomAvailMap = buildRoomAvailabilityMap(rooms)
        const dutyMap = buildDutyMap(duties)
        const { teacherMap, classMap, roomMap, komaSlotCount } =
          buildScheduleMaps(assignments, komaLookupSolver)

        const ctx: ConstraintContext = {
          condition,
          perSubjectConditions: condition.perSubjectConditions ?? [],
          komaLookup: komaLookupSolver,
          teacherAvailMap,
          roomAvailMap,
          dutyMap,
          teacherMap,
          classMap,
          roomMap,
          komaSlotCount,
          maxPeriodsPerDay: school?.maxPeriodsPerDay ?? 6,
          lunchAfterPeriod: school?.lunchAfterPeriod ?? 4,
        }

        const result = evaluateAllConstraints(ctx, assignments)
        setViolations(result)
      } catch {
        // Fail silently - violations are non-critical
      }
    }, 200)

    return () => {
      if (violationTimerRef.current) clearTimeout(violationTimerRef.current)
    }
  }, [
    editor.state.slots,
    condition,
    komas,
    teachers,
    rooms,
    duties,
    school,
    komaLookupSolver,
  ])

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

  // Violation map for grid (keyed by day-period, and optionally per class)
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

      const { komaId, slotId: activeSlotId } = activeData as {
        komaId: string
        slotId?: string
      }
      const { dayOfWeek, period } = overData as {
        dayOfWeek: number
        period: number
      }

      // Find existing slot(s) at drop target
      const existingAtTarget = editor.state.slots.filter(
        (s) => s.dayOfWeek === dayOfWeek && s.period === period
      )

      if (activeSlotId) {
        // --- MOVE or SWAP ---
        const activeSlot = editor.state.slots.find((s) => s.id === activeSlotId)
        if (!activeSlot) return
        // If dropped on same cell, do nothing
        if (
          activeSlot.dayOfWeek === dayOfWeek &&
          activeSlot.period === period
        ) {
          return
        }

        try {
          // Filter out self from target (shouldn't happen but safety)
          const targetSlots = existingAtTarget.filter(
            (s) => s.id !== activeSlotId
          )

          if (targetSlots.length > 0) {
            // SWAP: exchange positions of active and first target slot
            const targetSlot = targetSlots[0]

            const fromDay = activeSlot.dayOfWeek
            const fromPeriod = activeSlot.period

            // DB: remove both, then place both at swapped positions
            await removeSlot(activeSlotId)
            await removeSlot(targetSlot.id)

            const [newActiveSlot, newTargetSlot] = await Promise.all([
              placeSlot({
                komaId,
                dayOfWeek,
                period,
                placedBy: "manual",
              }),
              placeSlot({
                komaId: targetSlot.komaId,
                dayOfWeek: fromDay,
                period: fromPeriod,
                placedBy: "manual",
              }),
            ])

            if (newActiveSlot && newTargetSlot) {
              // Atomic editor swap (single undo entry)
              editor.swap(
                {
                  id: activeSlotId,
                  komaId,
                  dayOfWeek: fromDay,
                  period: fromPeriod,
                },
                {
                  id: targetSlot.id,
                  komaId: targetSlot.komaId,
                  dayOfWeek,
                  period,
                },
                newActiveSlot.id,
                newTargetSlot.id
              )
            }
          } else {
            // MOVE: simple move via DB
            await removeSlot(activeSlotId)
            const newSlot = await placeSlot({
              komaId,
              dayOfWeek,
              period,
              placedBy: "manual",
            })
            if (newSlot) {
              // Single undo entry for move
              editor.move(
                activeSlotId,
                komaId,
                activeSlot.dayOfWeek,
                activeSlot.period,
                dayOfWeek,
                period
              )
              // Sync the new DB slot ID without creating undo entry
              editor.updateSlotId(activeSlotId, newSlot.id)
            }
          }
        } catch {
          toast.error("移動に失敗しました")
          // Reload slots from DB to recover
          fetchSlots()
        }
      } else {
        // --- PLACE NEW ---
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
    [placeSlot, removeSlot, editor, fetchSlots]
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

  const handleKomaClick = useCallback((_komaId: string) => {
    // Select koma for placement
  }, [])

  const errorCount = violations.filter((v) => v.severity === "error").length

  // Sort classes for "all" mode (by grade then sortOrder)
  const sortedClasses = useMemo(() => {
    return [...classes].sort((a, b) => {
      const gradeA = a.grade?.gradeNum ?? 0
      const gradeB = b.grade?.gradeNum ?? 0
      if (gradeA !== gradeB) return gradeA - gradeB
      return a.sortOrder - b.sortOrder
    })
  }, [classes])

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
                disabledSlots={disabledSlots}
                onCellClick={handleCellClick}
                onRemoveSlot={handleRemoveSlot}
                onFixSlot={handleFixSlot}
                classes={sortedClasses}
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
