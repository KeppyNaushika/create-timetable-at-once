"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { PatternComparisonGrid } from "@/components/scheduler/PatternComparisonGrid"
import { PatternSummaryCard } from "@/components/scheduler/PatternSummaryCard"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useKomas } from "@/hooks/useKomas"
import { usePatterns } from "@/hooks/usePatterns"
import { useSchool } from "@/hooks/useSchool"
import type { Koma, TimetableSlot } from "@/types/common.types"

export default function PatternsPage() {
  const { school } = useSchool()
  const { komas, fetchKomas } = useKomas()
  const { patterns, adoptPattern, deletePattern } = usePatterns()
  const [selectedPatternIds, setSelectedPatternIds] = useState<string[]>([])
  const [patternSlots, setPatternSlots] = useState<
    { patternId: string; slots: TimetableSlot[] }[]
  >([])
  const [highlightDiffs, setHighlightDiffs] = useState(true)

  useEffect(() => {
    fetchKomas()
  }, [fetchKomas])

  // Load slots for selected patterns
  useEffect(() => {
    async function loadSlots() {
      const results: { patternId: string; slots: TimetableSlot[] }[] = []
      for (const pid of selectedPatternIds) {
        try {
          const pattern = await window.electronAPI.patternGetWithSlots(pid)
          if (pattern?.slots) {
            results.push({ patternId: pid, slots: pattern.slots })
          }
        } catch {
          // skip
        }
      }
      setPatternSlots(results)
    }
    loadSlots()
  }, [selectedPatternIds])

  const komaLookup = useMemo(() => {
    const map: Record<string, Koma> = {}
    for (const k of komas) {
      map[k.id] = k
    }
    return map
  }, [komas])

  const handleSelect = useCallback((id: string) => {
    setSelectedPatternIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id)
      if (prev.length >= 3) return [...prev.slice(1), id]
      return [...prev, id]
    })
  }, [])

  const handleAdopt = useCallback(
    async (id: string) => {
      try {
        await adoptPattern(id)
        toast.success("パターンを採用しました")
      } catch {
        toast.error("採用に失敗しました")
      }
    },
    [adoptPattern]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deletePattern(id)
        setSelectedPatternIds((prev) => prev.filter((p) => p !== id))
        toast.success("パターンを削除しました")
      } catch {
        toast.error("削除に失敗しました")
      }
    },
    [deletePattern]
  )

  // Find best pattern
  const bestPattern =
    patterns.length > 0
      ? patterns.reduce((best, p) => (p.score < best.score ? p : best))
      : null

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">パターン比較</h1>
        <p className="text-muted-foreground mt-1">
          複数の時間割パターンを比較・採用します
        </p>
      </div>

      {bestPattern && (
        <Card className="mb-4 border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-700">
              推奨パターン: {bestPattern.name || "無題"}
            </CardTitle>
            <CardDescription className="text-green-600">
              スコア {bestPattern.score.toFixed(0)} / 違反{" "}
              {bestPattern.violationCount}件
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {patterns.map((pattern) => (
          <PatternSummaryCard
            key={pattern.id}
            pattern={pattern}
            isSelected={selectedPatternIds.includes(pattern.id)}
            onSelect={handleSelect}
            onAdopt={handleAdopt}
            onDelete={handleDelete}
          />
        ))}
        {patterns.length === 0 && (
          <p className="text-muted-foreground col-span-full p-8 text-center">
            パターンがありません。自動作成または手動配置でパターンを作成してください。
          </p>
        )}
      </div>

      {selectedPatternIds.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>比較ビュー</CardTitle>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="highlight-diffs"
                  checked={highlightDiffs}
                  onCheckedChange={(v) => setHighlightDiffs(v === true)}
                />
                <Label htmlFor="highlight-diffs" className="text-xs">
                  差異をハイライト
                </Label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PatternComparisonGrid
              patternSlots={patternSlots}
              komaLookup={komaLookup}
              daysPerWeek={school?.daysPerWeek ?? 5}
              maxPeriodsPerDay={school?.maxPeriodsPerDay ?? 6}
              highlightDiffs={highlightDiffs}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
