"use client"

import { useCallback, useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { KOMA_TEACHER_ROLES, KOMA_TYPES } from "@/lib/constants"
import type { Koma } from "@/types/common.types"

interface TeacherKomaListProps {
  teacherId: string
}

export function TeacherKomaList({ teacherId }: TeacherKomaListProps) {
  const [komas, setKomas] = useState<Koma[]>([])
  const [loading, setLoading] = useState(true)

  const fetchKomas = useCallback(async () => {
    try {
      setLoading(true)
      const data = await window.electronAPI.komaGetByTeacherId(teacherId)
      setKomas(data)
    } catch {
      console.error("Failed to fetch komas for teacher")
    } finally {
      setLoading(false)
    }
  }, [teacherId])

  useEffect(() => {
    fetchKomas()
  }, [fetchKomas])

  if (loading) {
    return <p className="text-muted-foreground text-sm">読み込み中...</p>
  }

  if (komas.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        割り当てられた駒はありません
      </p>
    )
  }

  const totalCount = komas.reduce((sum, k) => sum + k.count, 0)

  return (
    <div className="space-y-2">
      <div className="text-muted-foreground text-sm">
        合計: {totalCount}コマ/週
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>学年</TableHead>
            <TableHead>教科</TableHead>
            <TableHead>種類</TableHead>
            <TableHead className="text-center">駒数</TableHead>
            <TableHead>役割</TableHead>
            <TableHead>ラベル</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {komas.map((koma) => {
            const role = koma.komaTeachers?.find(
              (kt) => kt.teacherId === teacherId
            )?.role
            return (
              <TableRow key={koma.id}>
                <TableCell>{koma.grade?.name ?? "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {koma.subject && (
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: koma.subject.color }}
                      />
                    )}
                    {koma.subject?.name ?? "-"}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {KOMA_TYPES[koma.type as keyof typeof KOMA_TYPES] ?? koma.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">{koma.count}</TableCell>
                <TableCell>
                  {role
                    ? KOMA_TEACHER_ROLES[
                        role as keyof typeof KOMA_TEACHER_ROLES
                      ]
                    : "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {koma.label || "-"}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
