"use client"

import { CalendarDays, Save, X } from "lucide-react"
import { useCallback, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Subject } from "@/types/common.types"
import type { ExamSchedule } from "@/types/exam.types"

interface ExamScheduleFormProps {
  schedule?: ExamSchedule | null
  subjects: Subject[]
  onSave: (data: Record<string, unknown>) => void
  onCancel: () => void
}

export function ExamScheduleForm({
  schedule,
  subjects,
  onSave,
  onCancel,
}: ExamScheduleFormProps) {
  const [name, setName] = useState(schedule?.name ?? "")
  const [startDate, setStartDate] = useState(schedule?.startDate ?? "")
  const [endDate, setEndDate] = useState(schedule?.endDate ?? "")
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(() => {
    if (schedule?.subjectsJson) {
      try {
        return JSON.parse(schedule.subjectsJson) as string[]
      } catch {
        return []
      }
    }
    return []
  })
  const [notes, setNotes] = useState(schedule?.notes ?? "")

  const handleSubjectToggle = useCallback(
    (subjectId: string, checked: boolean) => {
      setSelectedSubjects((prev) =>
        checked ? [...prev, subjectId] : prev.filter((id) => id !== subjectId)
      )
    },
    []
  )

  const handleSave = useCallback(() => {
    onSave({
      name,
      startDate,
      endDate,
      subjectsJson: JSON.stringify(selectedSubjects),
      notes,
    })
  }, [name, startDate, endDate, selectedSubjects, notes, onSave])

  const isValid = name.trim().length > 0 && startDate && endDate

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-4 w-4" />
          {schedule ? "考査日程の編集" : "新規考査日程"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="exam-name">考査名</Label>
          <Input
            id="exam-name"
            placeholder="例: 1学期期末考査"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="exam-start">開始日</Label>
            <Input
              id="exam-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exam-end">終了日</Label>
            <Input
              id="exam-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>対象科目</Label>
          <div className="grid grid-cols-2 gap-2 rounded-md border p-3 sm:grid-cols-3">
            {subjects.map((subject) => (
              <div key={subject.id} className="flex items-center gap-2">
                <Checkbox
                  id={`subject-${subject.id}`}
                  checked={selectedSubjects.includes(subject.id)}
                  onCheckedChange={(checked) =>
                    handleSubjectToggle(subject.id, checked === true)
                  }
                />
                <Label
                  htmlFor={`subject-${subject.id}`}
                  className="cursor-pointer text-sm font-normal"
                >
                  {subject.name}
                </Label>
              </div>
            ))}
            {subjects.length === 0 && (
              <p className="text-muted-foreground col-span-full text-sm">
                科目が登録されていません
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="exam-notes">備考</Label>
          <textarea
            id="exam-notes"
            className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="備考を入力..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button onClick={handleSave} disabled={!isValid}>
          <Save className="mr-2 h-4 w-4" />
          保存
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          キャンセル
        </Button>
      </CardFooter>
    </Card>
  )
}
