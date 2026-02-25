"use client"

import { ArrowLeft, ClipboardList, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useCallback, useEffect, useMemo, useState } from "react"

import { ExamAssignmentGrid } from "@/components/exam/ExamAssignmentGrid"
import { SupervisorCandidateDialog } from "@/components/exam/SupervisorCandidateDialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useExamSchedule } from "@/hooks/useExamSchedule"
import { useTimetableData } from "@/hooks/useTimetableData"
import type { SupervisorCandidate } from "@/types/exam.types"

function ExamAssignContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const scheduleId = searchParams.get("id") ?? ""

  const {
    currentSchedule,
    loading: examLoading,
    error: examError,
    fetchById,
    batchUpsertAssignments,
    clearAssignments,
  } = useExamSchedule()

  const { data: timetableData, loading: timetableLoading } = useTimetableData()

  const [candidateDialog, setCandidateDialog] = useState<{
    open: boolean
    date: string
    period: number
    classId: string
    subjectId: string
  }>({
    open: false,
    date: "",
    period: 0,
    classId: "",
    subjectId: "",
  })

  const [candidates, setCandidates] = useState<SupervisorCandidate[]>([])

  // Load schedule
  useEffect(() => {
    if (scheduleId) {
      fetchById(scheduleId)
    }
  }, [scheduleId, fetchById])

  // Subject map for display
  const subjectMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of timetableData.subjects) {
      map.set(s.id, s.name)
    }
    return map
  }, [timetableData.subjects])

  // Class map for display
  const classNameMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of timetableData.classes) {
      map.set(c.id, c.name)
    }
    return map
  }, [timetableData.classes])

  // Build candidates when cell clicked
  const handleCellClick = useCallback(
    (date: string, period: number, classId: string) => {
      if (!currentSchedule) return

      // Find which subject is in this date+period from the schedule's subject list
      let examSubjectIds: string[] = []
      try {
        examSubjectIds = JSON.parse(currentSchedule.subjectsJson) as string[]
      } catch {
        // ignore
      }

      // Simple candidate scoring: rank all teachers
      const assignments = currentSchedule.assignments ?? []
      const assignmentCounts = new Map<string, number>()
      for (const a of assignments) {
        assignmentCounts.set(
          a.supervisorId,
          (assignmentCounts.get(a.supervisorId) ?? 0) + 1
        )
      }

      const candidateList: SupervisorCandidate[] = timetableData.teachers.map(
        (teacher) => {
          const count = assignmentCounts.get(teacher.id) ?? 0
          const isSubjectTeacher = examSubjectIds.some(
            (sid) => sid === teacher.mainSubjectId
          )
          // Score: lower assignment count = higher score, subject teacher gets bonus
          let score = Math.max(0, 100 - count * 15)
          const reasons: string[] = []

          if (isSubjectTeacher) {
            score += 10
            reasons.push("教科担当")
          }
          if (count === 0) {
            reasons.push("未割当")
          }

          score = Math.min(100, Math.max(0, score))

          return {
            teacherId: teacher.id,
            teacherName: teacher.name,
            score,
            reasons,
            isSubjectTeacher,
            isSameSubjectTeacher: isSubjectTeacher,
            isAvailable: true,
            currentAssignmentCount: count,
          }
        }
      )

      candidateList.sort((a, b) => b.score - a.score)
      setCandidates(candidateList)

      // Find subject for display
      const subjectId = examSubjectIds[0] ?? ""

      setCandidateDialog({
        open: true,
        date,
        period,
        classId,
        subjectId,
      })
    },
    [currentSchedule, timetableData.teachers]
  )

  const handleSelectSupervisor = useCallback(
    async (teacherId: string) => {
      if (!currentSchedule) return
      const { date, period, classId, subjectId } = candidateDialog

      await batchUpsertAssignments(currentSchedule.id, [
        {
          date,
          period,
          classId,
          subjectId,
          supervisorId: teacherId,
          assignedBy: "manual",
        },
      ])

      // Refresh
      await fetchById(currentSchedule.id)
    },
    [currentSchedule, candidateDialog, batchUpsertAssignments, fetchById]
  )

  const handleAutoAssign = useCallback(async () => {
    if (!currentSchedule) return

    let examSubjectIds: string[] = []
    try {
      examSubjectIds = JSON.parse(currentSchedule.subjectsJson) as string[]
    } catch {
      return
    }

    // Simple auto-assign: distribute teachers evenly
    const teachers = [...timetableData.teachers]
    const newAssignments: Record<string, unknown>[] = []
    const start = new Date(currentSchedule.startDate)
    const end = new Date(currentSchedule.endDate)
    const current = new Date(start)
    let subjectIdx = 0
    let teacherIdx = 0

    while (current <= end && subjectIdx < examSubjectIds.length) {
      const dateStr = current.toISOString().slice(0, 10)

      for (const cls of timetableData.classes) {
        if (subjectIdx >= examSubjectIds.length) break
        if (teachers.length === 0) break

        newAssignments.push({
          date: dateStr,
          period: (subjectIdx % 4) + 1,
          classId: cls.id,
          subjectId: examSubjectIds[subjectIdx],
          supervisorId: teachers[teacherIdx % teachers.length].id,
          assignedBy: "auto",
        })

        teacherIdx++
      }

      subjectIdx++
      current.setDate(current.getDate() + 1)
    }

    if (newAssignments.length > 0) {
      await batchUpsertAssignments(currentSchedule.id, newAssignments)
      await fetchById(currentSchedule.id)
    }
  }, [currentSchedule, timetableData, batchUpsertAssignments, fetchById])

  const handleClear = useCallback(async () => {
    if (!currentSchedule) return
    if (!window.confirm("全ての割当をクリアしますか？")) return
    await clearAssignments(currentSchedule.id)
    await fetchById(currentSchedule.id)
  }, [currentSchedule, clearAssignments, fetchById])

  const isLoading = examLoading || timetableLoading

  if (!scheduleId) {
    return (
      <div className="text-muted-foreground p-8 text-center">
        考査日程IDが指定されていません
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/exam/schedule")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            <ClipboardList className="mr-2 inline h-5 w-5" />
            {currentSchedule?.name ?? "考査監督割当"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {currentSchedule
              ? `${currentSchedule.startDate} ~ ${currentSchedule.endDate}`
              : "読込中..."}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      ) : examError ? (
        <div className="text-destructive p-4">エラー: {examError}</div>
      ) : !currentSchedule ? (
        <div className="text-muted-foreground p-8 text-center">
          考査日程が見つかりません
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">監督割当表</CardTitle>
            <CardDescription>
              セルをクリックして監督者を割り当てます。
              {currentSchedule.assignments?.length ?? 0}件の割当済み。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExamAssignmentGrid
              schedule={currentSchedule}
              assignments={currentSchedule.assignments ?? []}
              classes={timetableData.classes}
              teachers={timetableData.teachers}
              subjects={timetableData.subjects}
              onCellClick={handleCellClick}
              onAutoAssign={handleAutoAssign}
              onClear={handleClear}
            />
          </CardContent>
        </Card>
      )}

      <SupervisorCandidateDialog
        open={candidateDialog.open}
        onClose={() => setCandidateDialog((prev) => ({ ...prev, open: false }))}
        candidates={candidates}
        onSelect={handleSelectSupervisor}
        date={candidateDialog.date}
        period={candidateDialog.period}
        className={
          classNameMap.get(candidateDialog.classId) ?? candidateDialog.classId
        }
        subjectName={
          subjectMap.get(candidateDialog.subjectId) ?? candidateDialog.subjectId
        }
      />
    </div>
  )
}

export default function ExamAssignPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      }
    >
      <ExamAssignContent />
    </Suspense>
  )
}
