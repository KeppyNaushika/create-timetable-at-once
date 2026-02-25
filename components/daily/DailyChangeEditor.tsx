"use client"

import { Pencil, Plus, Save, Trash2, X } from "lucide-react"
import { useState } from "react"

import { ChangeTypeSelector } from "@/components/daily/ChangeTypeSelector"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CHANGE_TYPES, SCHEDULE_TYPES } from "@/lib/constants"
import type {
  ClassInfo,
  Koma,
  Teacher,
  TimetableSlot,
} from "@/types/common.types"
import type { DailyChange, DailySchedule } from "@/types/daily.types"

interface DailyChangeEditorProps {
  schedule: DailySchedule | null
  changes: DailyChange[]
  classes: ClassInfo[]
  teachers: Teacher[]
  komas: Koma[]
  slots: TimetableSlot[]
  maxPeriods: number
  onSaveSchedule: (data: Record<string, unknown>) => void
  onAddChange: (data: Record<string, unknown>) => void
  onUpdateChange: (id: string, data: Record<string, unknown>) => void
  onDeleteChange: (id: string) => void
}

interface InlineForm {
  classId: string
  period: string
  changeType: string
  substituteTeacherId: string
  notes: string
}

const emptyForm: InlineForm = {
  classId: "",
  period: "",
  changeType: "cancel",
  substituteTeacherId: "",
  notes: "",
}

export function DailyChangeEditor({
  schedule,
  changes,
  classes,
  teachers,
  komas: _komas,
  slots: _slots,
  maxPeriods,
  onSaveSchedule,
  onAddChange,
  onUpdateChange,
  onDeleteChange,
}: DailyChangeEditorProps) {
  const [scheduleType, setScheduleType] = useState(
    schedule?.scheduleType ?? "normal"
  )
  const [reason, setReason] = useState(schedule?.reason ?? "")
  const [periodsCount, setPeriodsCount] = useState(
    schedule?.periodsCount?.toString() ?? ""
  )
  const [addingRow, setAddingRow] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<InlineForm>(emptyForm)

  const teacherMap = new Map(teachers.map((t) => [t.id, t]))
  const classMap = new Map(classes.map((c) => [c.id, c]))

  const handleSaveSchedule = () => {
    onSaveSchedule({
      scheduleType,
      reason,
      periodsCount: periodsCount ? parseInt(periodsCount, 10) : null,
    })
  }

  const handleAddChange = () => {
    onAddChange({
      classId: form.classId,
      period: parseInt(form.period, 10),
      changeType: form.changeType,
      substituteTeacherId: form.substituteTeacherId || null,
      notes: form.notes,
    })
    setForm(emptyForm)
    setAddingRow(false)
  }

  const handleUpdateChange = () => {
    if (!editingId) return
    onUpdateChange(editingId, {
      classId: form.classId,
      period: parseInt(form.period, 10),
      changeType: form.changeType,
      substituteTeacherId: form.substituteTeacherId || null,
      notes: form.notes,
    })
    setForm(emptyForm)
    setEditingId(null)
  }

  const handleStartEdit = (change: DailyChange) => {
    setEditingId(change.id)
    setAddingRow(false)
    setForm({
      classId: change.classId,
      period: change.period.toString(),
      changeType: change.changeType,
      substituteTeacherId: change.substituteTeacherId ?? "",
      notes: change.notes,
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setAddingRow(false)
    setForm(emptyForm)
  }

  const periods = Array.from({ length: maxPeriods }, (_, i) => i + 1)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">日課設定</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Schedule type section */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm">日課種別</Label>
            <Select value={scheduleType} onValueChange={setScheduleType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SCHEDULE_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">理由</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="理由を入力"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">時数</Label>
            <Input
              type="number"
              value={periodsCount}
              onChange={(e) => setPeriodsCount(e.target.value)}
              placeholder="時数"
              min={0}
              max={maxPeriods}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSaveSchedule}>
            <Save className="mr-1 h-3.5 w-3.5" />
            日課を保存
          </Button>
        </div>

        {/* Changes table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">変更一覧</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAddingRow(true)
                setEditingId(null)
                setForm(emptyForm)
              }}
              disabled={addingRow}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              変更追加
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>クラス</TableHead>
                <TableHead>時限</TableHead>
                <TableHead>変更種別</TableHead>
                <TableHead>代替先生</TableHead>
                <TableHead>備考</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {changes.map((change) => {
                const isEditing = editingId === change.id
                const teacher = change.substituteTeacherId
                  ? teacherMap.get(change.substituteTeacherId)
                  : null
                const cls = classMap.get(change.classId)

                if (isEditing) {
                  return (
                    <TableRow key={change.id}>
                      <TableCell>
                        <Select
                          value={form.classId}
                          onValueChange={(v) =>
                            setForm({ ...form, classId: v })
                          }
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="クラス" />
                          </SelectTrigger>
                          <SelectContent>
                            {classes.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={form.period}
                          onValueChange={(v) => setForm({ ...form, period: v })}
                        >
                          <SelectTrigger className="w-[80px]">
                            <SelectValue placeholder="時限" />
                          </SelectTrigger>
                          <SelectContent>
                            {periods.map((p) => (
                              <SelectItem key={p} value={p.toString()}>
                                {p}時限
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <ChangeTypeSelector
                          value={form.changeType}
                          onChange={(v) => setForm({ ...form, changeType: v })}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={form.substituteTeacherId}
                          onValueChange={(v) =>
                            setForm({ ...form, substituteTeacherId: v })
                          }
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="なし" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">なし</SelectItem>
                            {teachers.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={form.notes}
                          onChange={(e) =>
                            setForm({ ...form, notes: e.target.value })
                          }
                          placeholder="備考"
                          className="w-[120px]"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={handleUpdateChange}
                          >
                            <Save className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                }

                return (
                  <TableRow key={change.id}>
                    <TableCell>{cls?.name ?? "-"}</TableCell>
                    <TableCell>{change.period}時限</TableCell>
                    <TableCell>
                      {CHANGE_TYPES[
                        change.changeType as keyof typeof CHANGE_TYPES
                      ] ?? change.changeType}
                    </TableCell>
                    <TableCell>{teacher?.name ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {change.notes || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleStartEdit(change)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive h-7 w-7"
                          onClick={() => onDeleteChange(change.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}

              {/* Add row */}
              {addingRow && (
                <TableRow>
                  <TableCell>
                    <Select
                      value={form.classId}
                      onValueChange={(v) => setForm({ ...form, classId: v })}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="クラス" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={form.period}
                      onValueChange={(v) => setForm({ ...form, period: v })}
                    >
                      <SelectTrigger className="w-[80px]">
                        <SelectValue placeholder="時限" />
                      </SelectTrigger>
                      <SelectContent>
                        {periods.map((p) => (
                          <SelectItem key={p} value={p.toString()}>
                            {p}時限
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <ChangeTypeSelector
                      value={form.changeType}
                      onChange={(v) => setForm({ ...form, changeType: v })}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={form.substituteTeacherId}
                      onValueChange={(v) =>
                        setForm({ ...form, substituteTeacherId: v })
                      }
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="なし" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">なし</SelectItem>
                        {teachers.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={form.notes}
                      onChange={(e) =>
                        setForm({ ...form, notes: e.target.value })
                      }
                      placeholder="備考"
                      className="w-[120px]"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleAddChange}
                        disabled={!form.classId || !form.period}
                      >
                        <Save className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {changes.length === 0 && !addingRow && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground py-6 text-center"
                  >
                    変更はありません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
