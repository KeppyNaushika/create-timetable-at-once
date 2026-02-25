"use client"

import { AlertTriangle, Trophy, Users } from "lucide-react"
import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ElectiveResult, ElectiveStudent } from "@/types/exam.types"

interface ElectiveResultGridProps {
  result: ElectiveResult
  students: ElectiveStudent[]
}

export function ElectiveResultGrid({
  result,
  students,
}: ElectiveResultGridProps) {
  const studentMap = useMemo(() => {
    const map = new Map<string, ElectiveStudent>()
    for (const s of students) {
      map.set(s.id, s)
    }
    return map
  }, [students])

  const scoreColor =
    result.score >= 80
      ? "text-green-600 dark:text-green-400"
      : result.score >= 60
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-red-600 dark:text-red-400"

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4" />
              最適化結果
            </CardTitle>
            <Badge
              variant="outline"
              className={`text-lg font-bold ${scoreColor}`}
            >
              {result.score}点
            </Badge>
          </div>
          <CardDescription>
            {result.groups.length}グループ / 生徒{students.length}名中{" "}
            {students.length - result.unassigned.length}名配置済み
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {result.groups.map((group) => (
          <Card key={group.subjectName}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>{group.subjectName}</span>
                <Badge variant="secondary" className="text-xs">
                  <Users className="mr-1 h-3 w-3" />
                  {group.students.length}名
                </Badge>
              </CardTitle>
              {group.teacherId && (
                <CardDescription className="text-xs">
                  {group.period}時限目
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {group.students.map((studentId) => {
                  const student = studentMap.get(studentId)
                  return (
                    <Badge
                      key={studentId}
                      variant="outline"
                      className="text-xs"
                    >
                      {student?.name ?? studentId}
                    </Badge>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {result.unassigned.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-destructive flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4" />
              未配置の生徒 ({result.unassigned.length}名)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {result.unassigned.map((studentId) => {
                const student = studentMap.get(studentId)
                return (
                  <Badge
                    key={studentId}
                    variant="destructive"
                    className="text-xs"
                  >
                    {student?.name ?? studentId}
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
