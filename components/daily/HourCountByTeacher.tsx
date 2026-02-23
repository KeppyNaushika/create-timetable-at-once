"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { HourCountByTeacherRow } from "@/types/daily.types"

interface HourCountByTeacherProps {
  rows: HourCountByTeacherRow[]
  title?: string
}

export function HourCountByTeacher({
  rows,
  title = "先生別時数集計",
}: HourCountByTeacherProps) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-4 text-center text-sm text-muted-foreground">
            データがありません
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalPlanned = rows.reduce((sum, r) => sum + r.planned, 0)
  const totalActual = rows.reduce((sum, r) => sum + r.actual, 0)
  const totalDiff = totalActual - totalPlanned

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>先生</TableHead>
              <TableHead className="text-right">計画</TableHead>
              <TableHead className="text-right">実績</TableHead>
              <TableHead className="text-right">差分</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.teacherId}>
                <TableCell className="font-medium">{row.teacherName}</TableCell>
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
            ))}
            {/* Total row */}
            <TableRow className="font-bold border-t-2">
              <TableCell>合計</TableCell>
              <TableCell className="text-right">{totalPlanned}</TableCell>
              <TableCell className="text-right">{totalActual}</TableCell>
              <TableCell
                className={`text-right ${
                  totalDiff > 0
                    ? "text-green-600"
                    : totalDiff < 0
                      ? "text-red-600"
                      : ""
                }`}
              >
                {totalDiff > 0 ? `+${totalDiff}` : totalDiff}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
