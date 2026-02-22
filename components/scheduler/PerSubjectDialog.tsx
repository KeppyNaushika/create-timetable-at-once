"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PLACEMENT_RESTRICTIONS } from "@/lib/constants"
import type { PerSubjectCondition, Subject } from "@/types/common.types"

interface PerSubjectDialogProps {
  conditionId: string
  subjects: Subject[]
  perSubjectConditions: PerSubjectCondition[]
  onUpsert: (data: {
    conditionId: string
    subjectId: string
    placementRestriction?: string
    maxPerDay?: number
  }) => Promise<void>
  onDelete: (conditionId: string, subjectId: string) => Promise<void>
}

export function PerSubjectDialog({
  conditionId,
  subjects,
  perSubjectConditions,
  onUpsert,
  onDelete,
}: PerSubjectDialogProps) {
  const [open, setOpen] = useState(false)

  const getCondition = (subjectId: string) =>
    perSubjectConditions.find((c) => c.subjectId === subjectId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          教科別条件 ({perSubjectConditions.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>教科別制約条件</DialogTitle>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>教科</TableHead>
              <TableHead>配置制限</TableHead>
              <TableHead>1日最大</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects
              .filter((s) => s.category === "general")
              .map((subject) => {
                const cond = getCondition(subject.id)
                return (
                  <TableRow key={subject.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: subject.color }}
                        />
                        {subject.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={cond?.placementRestriction ?? "any"}
                        onValueChange={(v) =>
                          onUpsert({
                            conditionId,
                            subjectId: subject.id,
                            placementRestriction: v,
                            maxPerDay: cond?.maxPerDay ?? 2,
                          })
                        }
                      >
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PLACEMENT_RESTRICTIONS).map(
                            ([k, v]) => (
                              <SelectItem key={k} value={k}>
                                {v}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={String(cond?.maxPerDay ?? 2)}
                        onValueChange={(v) =>
                          onUpsert({
                            conditionId,
                            subjectId: subject.id,
                            placementRestriction:
                              cond?.placementRestriction ?? "any",
                            maxPerDay: parseInt(v),
                          })
                        }
                      >
                        <SelectTrigger className="h-8 w-16">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {cond && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(conditionId, subject.id)}
                        >
                          削除
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  )
}
