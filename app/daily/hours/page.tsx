"use client"

import { useState, useEffect, useCallback } from "react"
import { Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useHourCount } from "@/hooks/useHourCount"
import { useTimetableData } from "@/hooks/useTimetableData"
import type { TimetablePattern } from "@/types/common.types"

export default function HoursPage() {
  const { data, loading: timetableLoading } = useTimetableData()
  const { hourCounts, teacherCounts, loading, error, calculateHours } =
    useHourCount()

  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(
    null
  )
  const [patterns, setPatterns] = useState<TimetablePattern[]>([])

  // Load patterns
  useEffect(() => {
    async function loadPatterns() {
      try {
        const all = await window.electronAPI.patternGetAll()
        setPatterns(all)
        // Auto-select adopted pattern
        const adopted = all.find(
          (p: TimetablePattern) => p.status === "adopted"
        )
        if (adopted) {
          setSelectedPatternId(adopted.id)
        }
      } catch {
        // Silently ignore
      }
    }
    loadPatterns()
  }, [])

  // Calculate when pattern changes
  useEffect(() => {
    if (selectedPatternId) {
      calculateHours({ patternId: selectedPatternId })
    }
  }, [selectedPatternId, calculateHours])

  const isLoading = timetableLoading || loading

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">時数集計</h1>
        <p className="text-sm text-muted-foreground">
          科目別・クラス別の配置時数を確認します
        </p>
      </div>

      {/* Pattern selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            パターン選択
          </CardTitle>
        </CardHeader>
        <CardContent>
          <select
            className="h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm"
            value={selectedPatternId ?? ""}
            onChange={(e) => setSelectedPatternId(e.target.value || null)}
          >
            <option value="">パターンを選択...</option>
            {patterns.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.status === "adopted" ? " (採用中)" : ""}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="p-4 text-destructive">エラー: {error}</div>
      ) : (
        <>
          {/* Subject x Class hour counts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                科目別・クラス別時数
              </CardTitle>
              <CardDescription>
                予定時数と配置時数の比較 ({hourCounts.length}件)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hourCounts.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  データがありません。パターンを選択してください。
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>科目</TableHead>
                      <TableHead>クラス</TableHead>
                      <TableHead className="text-right">予定</TableHead>
                      <TableHead className="text-right">配置</TableHead>
                      <TableHead className="text-right">差分</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hourCounts.map((row) => (
                      <TableRow key={`${row.subjectId}__${row.classId}`}>
                        <TableCell className="font-medium">
                          {row.subjectName}
                        </TableCell>
                        <TableCell>{row.className}</TableCell>
                        <TableCell className="text-right">
                          {row.planned}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.actual}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              row.diff === 0
                                ? "secondary"
                                : row.diff > 0
                                  ? "default"
                                  : "destructive"
                            }
                          >
                            {row.diff > 0 ? "+" : ""}
                            {row.diff}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Teacher hour counts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">教員別時数</CardTitle>
              <CardDescription>
                教員ごとの予定時数と配置時数 ({teacherCounts.length}名)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teacherCounts.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  データがありません
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>教員名</TableHead>
                      <TableHead className="text-right">予定</TableHead>
                      <TableHead className="text-right">配置</TableHead>
                      <TableHead className="text-right">差分</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherCounts.map((row) => (
                      <TableRow key={row.teacherId}>
                        <TableCell className="font-medium">
                          {row.teacherName}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.planned}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.actual}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              row.diff === 0
                                ? "secondary"
                                : row.diff > 0
                                  ? "default"
                                  : "destructive"
                            }
                          >
                            {row.diff > 0 ? "+" : ""}
                            {row.diff}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
