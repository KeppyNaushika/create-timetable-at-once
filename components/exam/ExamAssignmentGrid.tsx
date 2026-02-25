"use client"

import { Trash2, Wand2 } from "lucide-react"
import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ClassInfo, Subject, Teacher } from "@/types/common.types"
import type { ExamAssignment, ExamSchedule } from "@/types/exam.types"

interface ExamAssignmentGridProps {
  schedule: ExamSchedule
  assignments: ExamAssignment[]
  classes: ClassInfo[]
  teachers: Teacher[]
  subjects: Subject[]
  onCellClick: (date: string, period: number, classId: string) => void
  onAutoAssign: () => void
  onClear: () => void
}

export function ExamAssignmentGrid({
  schedule,
  assignments,
  classes,
  teachers,
  subjects,
  onCellClick,
  onAutoAssign,
  onClear,
}: ExamAssignmentGridProps) {
  const teacherMap = useMemo(() => {
    const map = new Map<string, Teacher>()
    for (const t of teachers) {
      map.set(t.id, t)
    }
    return map
  }, [teachers])

  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>()
    for (const s of subjects) {
      map.set(s.id, s)
    }
    return map
  }, [subjects])

  // Build assignment lookup: "date__period__classId" -> ExamAssignment
  const assignmentMap = useMemo(() => {
    const map = new Map<string, ExamAssignment>()
    for (const a of assignments) {
      const key = `${a.date}__${a.period}__${a.classId}`
      map.set(key, a)
    }
    return map
  }, [assignments])

  // Parse exam subjects
  const examSubjectIds: string[] = useMemo(() => {
    try {
      return JSON.parse(schedule.subjectsJson) as string[]
    } catch {
      return []
    }
  }, [schedule.subjectsJson])

  // Build date/period rows
  const rows = useMemo(() => {
    const result: { date: string; period: number; subjectId: string }[] = []
    const start = new Date(schedule.startDate)
    const end = new Date(schedule.endDate)
    const current = new Date(start)
    let subjectIdx = 0

    while (current <= end) {
      const dateStr = current.toISOString().slice(0, 10)
      // Assume up to 4 periods per exam day
      const periodsPerDay = Math.min(
        Math.ceil(
          examSubjectIds.length / Math.max(1, daysBetween(start, end) + 1)
        ),
        4
      )
      const actualPeriods = Math.max(1, periodsPerDay)

      for (let p = 1; p <= actualPeriods; p++) {
        if (subjectIdx < examSubjectIds.length) {
          result.push({
            date: dateStr,
            period: p,
            subjectId: examSubjectIds[subjectIdx],
          })
          subjectIdx++
        }
      }
      current.setDate(current.getDate() + 1)
    }
    return result
  }, [schedule, examSubjectIds])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button onClick={onAutoAssign} size="sm">
          <Wand2 className="mr-2 h-4 w-4" />
          自動割当
        </Button>
        <Button variant="outline" size="sm" onClick={onClear}>
          <Trash2 className="mr-2 h-4 w-4" />
          クリア
        </Button>
        <div className="text-muted-foreground ml-auto flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded border border-blue-300 bg-blue-100" />
            自動
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded border border-green-300 bg-green-100" />
            手動
          </span>
        </div>
      </div>

      <ScrollArea className="w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-background sticky left-0 z-10 min-w-[100px]">
                日時
              </TableHead>
              <TableHead className="min-w-[80px]">科目</TableHead>
              {classes.map((cls) => (
                <TableHead key={cls.id} className="min-w-[100px] text-center">
                  {cls.name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const subject = subjectMap.get(row.subjectId)
              return (
                <TableRow key={`${row.date}__${row.period}`}>
                  <TableCell className="bg-background sticky left-0 z-10 font-medium whitespace-nowrap">
                    {row.date}
                    <br />
                    <span className="text-muted-foreground text-xs">
                      {row.period}限
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="whitespace-nowrap">
                      {subject?.shortName ?? subject?.name ?? row.subjectId}
                    </Badge>
                  </TableCell>
                  {classes.map((cls) => {
                    const key = `${row.date}__${row.period}__${cls.id}`
                    const assignment = assignmentMap.get(key)
                    const teacher = assignment
                      ? teacherMap.get(assignment.supervisorId)
                      : null
                    const isAuto = assignment?.assignedBy === "auto"

                    return (
                      <TableCell
                        key={cls.id}
                        className={`hover:bg-muted/50 cursor-pointer text-center transition-colors ${
                          assignment
                            ? isAuto
                              ? "bg-blue-50 dark:bg-blue-950/30"
                              : "bg-green-50 dark:bg-green-950/30"
                            : ""
                        }`}
                        onClick={() =>
                          onCellClick(row.date, row.period, cls.id)
                        }
                      >
                        {teacher ? (
                          <span className="text-sm font-medium">
                            {teacher.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            --
                          </span>
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={classes.length + 2}
                  className="text-muted-foreground h-24 text-center"
                >
                  考査科目が設定されていません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}

function daysBetween(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}
