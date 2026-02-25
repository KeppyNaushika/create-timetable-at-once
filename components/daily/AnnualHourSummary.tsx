"use client"

import { Calendar, CalendarDays, GraduationCap } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface AnnualHourSummaryProps {
  totalDays: number
  classDays: number
  eventDays: number
  hoursBySubject: Record<string, number>
}

export function AnnualHourSummary({
  totalDays,
  classDays,
  eventDays,
  hoursBySubject,
}: AnnualHourSummaryProps) {
  const subjectEntries = Object.entries(hoursBySubject).sort(
    ([, a], [, b]) => b - a
  )
  const totalHours = subjectEntries.reduce((sum, [, hours]) => sum + hours, 0)

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
              <CalendarDays className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">総日数</p>
              <p className="text-2xl font-bold">{totalDays}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50">
              <GraduationCap className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">授業日数</p>
              <p className="text-2xl font-bold">{classDays}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">行事日数</p>
              <p className="text-2xl font-bold">{eventDays}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject hours table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">教科別時数</CardTitle>
        </CardHeader>
        <CardContent>
          {subjectEntries.length === 0 ? (
            <div className="text-muted-foreground py-4 text-center text-sm">
              データがありません
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>教科</TableHead>
                  <TableHead className="text-right">時数</TableHead>
                  <TableHead className="text-right">割合</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjectEntries.map(([subject, hours]) => (
                  <TableRow key={subject}>
                    <TableCell className="font-medium">{subject}</TableCell>
                    <TableCell className="text-right">{hours}</TableCell>
                    <TableCell className="text-muted-foreground text-right">
                      {totalHours > 0
                        ? `${((hours / totalHours) * 100).toFixed(1)}%`
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Total row */}
                <TableRow className="border-t-2 font-bold">
                  <TableCell>合計</TableCell>
                  <TableCell className="text-right">{totalHours}</TableCell>
                  <TableCell className="text-right">100%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
