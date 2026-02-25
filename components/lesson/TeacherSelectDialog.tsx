"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { Teacher } from "@/types/common.types"

interface TeacherSelectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teachers: Teacher[]
  currentMainId: string | null
  currentSubIds: string[]
  onSave: (teachers: { teacherId: string; role: string }[]) => Promise<void>
}

export function TeacherSelectDialog({
  open,
  onOpenChange,
  teachers,
  currentMainId,
  currentSubIds,
  onSave,
}: TeacherSelectDialogProps) {
  const [mainId, setMainId] = useState<string>("none")
  const [subIds, setSubIds] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (open) {
      setMainId(currentMainId ?? "none")
      setSubIds(new Set(currentSubIds))
      setSearch("")
    }
  }, [open, currentMainId, currentSubIds])

  const filteredTeachers = useMemo(() => {
    if (!search.trim()) return teachers
    const q = search.trim().toLowerCase()
    return teachers.filter(
      (t) =>
        t.name.toLowerCase().includes(q) || t.nameKana.toLowerCase().includes(q)
    )
  }, [teachers, search])

  const handleSubToggle = useCallback((teacherId: string, checked: boolean) => {
    setSubIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(teacherId)
      } else {
        next.delete(teacherId)
      }
      return next
    })
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const result: { teacherId: string; role: string }[] = []
      if (mainId !== "none") {
        result.push({ teacherId: mainId, role: "main" })
      }
      for (const sid of subIds) {
        if (sid !== mainId) {
          result.push({ teacherId: sid, role: "sub" })
        }
      }
      await onSave(result)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }, [mainId, subIds, onSave, onOpenChange])

  // 副担当の選択肢から主担当を除外
  const subCandidates = filteredTeachers.filter((t) => t.id !== mainId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-sm overflow-auto">
        <DialogHeader>
          <DialogTitle>担当先生の設定</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="先生を検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />

          <div className="space-y-2">
            <Label className="text-xs font-semibold">
              主担当（{filteredTeachers.length}人）
            </Label>
            <RadioGroup value={mainId} onValueChange={setMainId}>
              {!search && (
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="none" id="main-none" />
                  <Label
                    htmlFor="main-none"
                    className="text-muted-foreground cursor-pointer text-sm"
                  >
                    なし
                  </Label>
                </div>
              )}
              {filteredTeachers.map((t) => (
                <div key={t.id} className="flex items-center gap-2">
                  <RadioGroupItem value={t.id} id={`main-${t.id}`} />
                  <Label
                    htmlFor={`main-${t.id}`}
                    className="cursor-pointer text-sm"
                  >
                    {t.name}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {mainId !== "none" && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold">
                副担当（共同授業）
              </Label>
              <div className="space-y-1">
                {subCandidates.map((t) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`sub-${t.id}`}
                      checked={subIds.has(t.id)}
                      onCheckedChange={(checked) =>
                        handleSubToggle(t.id, checked === true)
                      }
                    />
                    <Label
                      htmlFor={`sub-${t.id}`}
                      className="cursor-pointer text-sm"
                    >
                      {t.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              保存
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
