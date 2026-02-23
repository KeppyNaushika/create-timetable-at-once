"use client"

import { Button } from "@/components/ui/button"
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

const LEVEL_OPTIONS = {
  forbidden: "禁止",
  consider: "考慮",
  ignore: "無視",
} as const

interface PerSubjectSectionProps {
  conditionId: string
  subjects: Subject[]
  perSubjectConditions: PerSubjectCondition[]
  onUpsert: (data: {
    conditionId: string
    subjectId: string
    level?: string
    placementRestriction?: string
    maxPerDay?: number
  }) => Promise<void>
  onDelete: (conditionId: string, subjectId: string) => Promise<void>
}

export function PerSubjectSection({
  conditionId,
  subjects,
  perSubjectConditions,
  onUpsert,
  onDelete,
}: PerSubjectSectionProps) {
  const getCondition = (subjectId: string) =>
    perSubjectConditions.find((c) => c.subjectId === subjectId)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>教科</TableHead>
          <TableHead>レベル</TableHead>
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
            const level = cond?.level ?? "consider"
            const isIgnored = level === "ignore"
            return (
              <TableRow key={subject.id} className={isIgnored ? "opacity-40" : ""}>
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
                    value={level}
                    onValueChange={(v) =>
                      onUpsert({
                        conditionId,
                        subjectId: subject.id,
                        level: v,
                        placementRestriction:
                          cond?.placementRestriction ?? "any",
                        maxPerDay: cond?.maxPerDay ?? 2,
                      })
                    }
                  >
                    <SelectTrigger className="h-8 w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LEVEL_OPTIONS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    disabled={isIgnored}
                    value={cond?.placementRestriction ?? "any"}
                    onValueChange={(v) =>
                      onUpsert({
                        conditionId,
                        subjectId: subject.id,
                        level,
                        placementRestriction: v,
                        maxPerDay: cond?.maxPerDay ?? 2,
                      })
                    }
                  >
                    <SelectTrigger className="h-8 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PLACEMENT_RESTRICTIONS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    disabled={isIgnored}
                    value={String(cond?.maxPerDay ?? 2)}
                    onValueChange={(v) =>
                      onUpsert({
                        conditionId,
                        subjectId: subject.id,
                        level,
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
  )
}
