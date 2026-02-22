"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { TeacherCapacityResult } from "@/hooks/useKomaCheck"

interface CapacityCheckTableProps {
  data: TeacherCapacityResult[]
  daysPerWeek: number
  maxPeriodsPerDay: number
}

export function CapacityCheckTable({
  data,
  daysPerWeek,
  maxPeriodsPerDay,
}: CapacityCheckTableProps) {
  const totalSlotsPerWeek = daysPerWeek * maxPeriodsPerDay

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>先生名</TableHead>
          <TableHead className="text-right">持ち駒数</TableHead>
          <TableHead className="text-right">週コマ数</TableHead>
          <TableHead className="text-right">週上限</TableHead>
          <TableHead className="text-right">不可数</TableHead>
          <TableHead className="text-right">校務数</TableHead>
          <TableHead className="text-right">空き枠</TableHead>
          <TableHead className="text-right">過不足</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((t) => {
          const availableSlots =
            totalSlotsPerWeek - t.unavailableCount - t.dutyCount
          const diff = availableSlots - t.totalKomaCount
          const isOver = diff < 0
          const isWarning = diff >= 0 && diff <= 2

          return (
            <TableRow key={t.id}>
              <TableCell className="font-medium">{t.name}</TableCell>
              <TableCell className="text-right">{t.komaCount}</TableCell>
              <TableCell className="text-right">{t.totalKomaCount}</TableCell>
              <TableCell className="text-right">
                {t.maxPeriodsPerWeek}
              </TableCell>
              <TableCell className="text-right">{t.unavailableCount}</TableCell>
              <TableCell className="text-right">{t.dutyCount}</TableCell>
              <TableCell className="text-right">{availableSlots}</TableCell>
              <TableCell
                className={cn(
                  "text-right font-bold",
                  isOver && "text-destructive",
                  isWarning && "text-yellow-600"
                )}
              >
                {diff >= 0 ? `+${diff}` : diff}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
