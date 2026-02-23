"use client"

import { useCallback, useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { KOMA_TYPES } from "@/lib/constants"
import { CURRICULUM_PRESETS } from "@/lib/komaGenerator"
import type { Grade, Subject } from "@/types/common.types"

interface PresetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  grades: Grade[]
  subjects: Subject[]
  onGenerate: (
    gradeId: string,
    items: { subjectId: string; count: number; type: string }[]
  ) => Promise<void>
  onDeleteAndGenerate: (
    gradeId: string,
    items: { subjectId: string; count: number; type: string }[]
  ) => Promise<void>
}

interface PresetItem {
  count: number
  type: string
  enabled: boolean
}

export function PresetDialog({
  open,
  onOpenChange,
  grades,
  subjects,
  onGenerate,
  onDeleteAndGenerate,
}: PresetDialogProps) {
  const [gradeId, setGradeId] = useState("")
  const [preset, setPreset] = useState<Record<string, PresetItem>>({})
  const [loading, setLoading] = useState(false)

  const selectedGrade = grades.find((g) => g.id === gradeId)

  const handleLoadPreset = useCallback(() => {
    if (!selectedGrade) return
    const items = CURRICULUM_PRESETS[selectedGrade.gradeNum]
    if (!items) return

    const map: Record<string, PresetItem> = {}
    for (const item of items) {
      const subject = subjects.find((s) => s.name === item.subjectName)
      if (subject) {
        map[subject.id] = {
          count: item.weeklyHours,
          type: item.type ?? "normal",
          enabled: true,
        }
      }
    }
    setPreset(map)
  }, [selectedGrade, subjects])

  const buildItems = useCallback(() => {
    return Object.entries(preset)
      .filter(([, v]) => v.enabled && v.count > 0)
      .map(([subjectId, v]) => ({
        subjectId,
        count: v.count,
        type: v.type,
      }))
  }, [preset])

  const handleGenerate = useCallback(async () => {
    if (!gradeId) return
    setLoading(true)
    try {
      await onGenerate(gradeId, buildItems())
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }, [gradeId, buildItems, onGenerate, onOpenChange])

  const handleDeleteAndGenerate = useCallback(async () => {
    if (!gradeId) return
    setLoading(true)
    try {
      await onDeleteAndGenerate(gradeId, buildItems())
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }, [gradeId, buildItems, onDeleteAndGenerate, onOpenChange])

  const hasItems = Object.keys(preset).length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>プリセットから一括生成</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label>対象学年</Label>
              <Select value={gradeId} onValueChange={setGradeId}>
                <SelectTrigger>
                  <SelectValue placeholder="学年を選択" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={handleLoadPreset}
              disabled={!selectedGrade}
            >
              プリセット読込
            </Button>
          </div>

          {hasItems && (
            <div className="max-h-80 overflow-auto rounded border">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left">教科</th>
                    <th className="w-20 p-2 text-center">週時間</th>
                    <th className="w-24 p-2 text-center">種類</th>
                    <th className="w-16 p-2 text-center">生成</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects
                    .filter((s) => preset[s.id])
                    .map((subject) => {
                      const item = preset[subject.id]
                      return (
                        <tr key={subject.id} className="border-t">
                          <td className="p-2">{subject.name}</td>
                          <td className="p-2 text-center">
                            <Input
                              type="number"
                              min={0}
                              max={10}
                              className="h-7 w-16 text-center"
                              value={item.count}
                              onChange={(e) =>
                                setPreset({
                                  ...preset,
                                  [subject.id]: {
                                    ...item,
                                    count: parseInt(e.target.value) || 0,
                                  },
                                })
                              }
                            />
                          </td>
                          <td className="p-2 text-center">
                            <Select
                              value={item.type}
                              onValueChange={(v) =>
                                setPreset({
                                  ...preset,
                                  [subject.id]: { ...item, type: v },
                                })
                              }
                            >
                              <SelectTrigger className="h-7 w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(KOMA_TYPES).map(
                                  ([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-2 text-center">
                            <Checkbox
                              checked={item.enabled}
                              onCheckedChange={(checked) =>
                                setPreset({
                                  ...preset,
                                  [subject.id]: {
                                    ...item,
                                    enabled: checked === true,
                                  },
                                })
                              }
                            />
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAndGenerate}
              disabled={!gradeId || !hasItems || loading}
            >
              既存を削除して生成
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!gradeId || !hasItems || loading}
            >
              追加生成
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
