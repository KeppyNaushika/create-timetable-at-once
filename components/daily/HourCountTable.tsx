"use client"

import { useMemo } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { HourCountRow } from "@/types/daily.types"

interface HourCountTableProps {
  rows: HourCountRow[]
  title?: string
}

export function HourCountTable({
  rows,
  title = "時数集計",
}: HourCountTableProps) {
  // Group by subject
  const grouped = useMemo(() => {
    const map = new Map<string, HourCountRow[]>()
    for (const row of rows) {
      const existing = map.get(row.subjectId) ?? []
      existing.push(row)
      map.set(row.subjectId, existing)
    }
    return Array.from(map.entries())
  }, [rows])

  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground py-4 text-center text-sm">
            データがありません
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>科目</TableHead>
              <TableHead>クラス</TableHead>
              <TableHead className="text-right">計画</TableHead>
              <TableHead className="text-right">実績</TableHead>
              <TableHead className="text-right">差分</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grouped.map(([_subjectId, subjectRows]) =>
              subjectRows.map((row, i) => (
                <TableRow key={`${row.subjectId}-${row.classId}`}>
                  {i === 0 ? (
                    <TableCell
                      rowSpan={subjectRows.length}
                      className="border-r font-medium"
                    >
                      {row.subjectName}
                    </TableCell>
                  ) : null}
                  <TableCell>{row.className}</TableCell>
                  <TableCell className="text-right">{row.planned}</TableCell>
                  <TableCell className="text-right">{row.actual}</TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      row.diff > 0
                        ? "text-green-600"
                        : row.diff < 0
                          ? "text-red-600"
                          : ""
                    }`}
                  >
                    {row.diff > 0 ? `+${row.diff}` : row.diff}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
