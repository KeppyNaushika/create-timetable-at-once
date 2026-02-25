"use client"

import { ArrowRight, CalendarDays, Loader2, Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import { ExamScheduleForm } from "@/components/exam/ExamScheduleForm"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useExamSchedule } from "@/hooks/useExamSchedule"
import type { Subject } from "@/types/common.types"

export default function ExamScheduleListPage() {
  const router = useRouter()
  const { schedules, loading, error, createSchedule, deleteSchedule } =
    useExamSchedule()

  const [showForm, setShowForm] = useState(false)
  const [subjects, setSubjects] = useState<Subject[]>([])

  // Load subjects for the form
  useEffect(() => {
    async function loadSubjects() {
      try {
        const data = await window.electronAPI.subjectGetAll()
        setSubjects(data)
      } catch {
        // Silently ignore
      }
    }
    loadSubjects()
  }, [])

  const handleCreate = useCallback(
    async (data: Record<string, unknown>) => {
      await createSchedule(data)
      setShowForm(false)
    },
    [createSchedule]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      if (
        !window.confirm(
          "この考査日程を削除しますか？割当データも削除されます。"
        )
      ) {
        return
      }
      await deleteSchedule(id)
    },
    [deleteSchedule]
  )

  const handleNavigateToAssign = useCallback(
    (id: string) => {
      router.push(`/exam/assign?id=${id}`)
    },
    [router]
  )

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">考査日程管理</h1>
          <p className="text-muted-foreground text-sm">
            定期考査の日程を作成し、監督割当を行います
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新規作成
        </Button>
      </div>

      {error && <div className="text-destructive p-4">エラー: {error}</div>}

      {schedules.length === 0 && !error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <p className="text-muted-foreground">
              考査日程がありません。「新規作成」から追加してください。
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {schedules.map((schedule) => {
            let subjectIds: string[] = []
            try {
              subjectIds = JSON.parse(schedule.subjectsJson) as string[]
            } catch {
              // ignore
            }
            const subjectNames = subjectIds
              .map((id) => subjects.find((s) => s.id === id)?.name ?? id)
              .join(", ")

            return (
              <Card key={schedule.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CalendarDays className="h-4 w-4" />
                    {schedule.name}
                  </CardTitle>
                  <CardDescription>
                    {schedule.startDate} ~ {schedule.endDate}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {subjectNames && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">科目: </span>
                      {subjectNames}
                    </div>
                  )}
                  {schedule.notes && (
                    <p className="text-muted-foreground text-sm">
                      {schedule.notes}
                    </p>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {schedule.assignments?.length ?? 0}件の割当
                  </Badge>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleNavigateToAssign(schedule.id)}
                  >
                    割当管理
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(schedule.id)}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    削除
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新規考査日程</DialogTitle>
          </DialogHeader>
          <ExamScheduleForm
            subjects={subjects}
            onSave={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
