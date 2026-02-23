"use client"

import { useCallback } from "react"

import { Slider } from "@/components/ui/slider"
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
import {
  CONSTRAINT_FIELDS,
  CONSTRAINT_LEVELS,
  type ConstraintLevel,
} from "@/lib/constants"
import type { ScheduleCondition } from "@/types/common.types"

interface ConditionTableProps {
  condition: ScheduleCondition
  onUpdate: (data: Record<string, unknown>) => Promise<unknown>
}

const categoryLabels: Record<string, string> = {
  teacher: "先生",
  class: "クラス",
  room: "教室",
  duty: "校務",
  koma: "駒",
  balance: "バランス",
}

export function ConditionTable({ condition, onUpdate }: ConditionTableProps) {
  const handleLevelChange = useCallback(
    async (key: string, value: string) => {
      await onUpdate({ [key]: value })
    },
    [onUpdate]
  )

  const handleWeightChange = useCallback(
    async (key: string, value: number[]) => {
      await onUpdate({ [`${key}Weight`]: value[0] })
    },
    [onUpdate]
  )

  let currentCategory = ""

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-40">カテゴリ</TableHead>
          <TableHead className="w-52">制約項目</TableHead>
          <TableHead className="w-56">説明</TableHead>
          <TableHead className="w-32">レベル</TableHead>
          <TableHead className="w-40">重み</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {CONSTRAINT_FIELDS.map((field) => {
          const showCategory = field.category !== currentCategory
          currentCategory = field.category
          const conditionRecord = condition as unknown as Record<
            string,
            unknown
          >
          const level = conditionRecord[field.key] as string
          const weight = conditionRecord[`${field.key}Weight`] as number
          const isConsider = level === "consider"

          return (
            <TableRow key={field.key}>
              <TableCell className="text-muted-foreground text-xs font-medium">
                {showCategory ? categoryLabels[field.category] : ""}
              </TableCell>
              <TableCell className="font-medium">{field.label}</TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {field.description}
              </TableCell>
              <TableCell>
                <Select
                  value={level}
                  onValueChange={(v) => handleLevelChange(field.key, v)}
                >
                  <SelectTrigger className="h-8 w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {field.allowedLevels.map((l) => (
                      <SelectItem key={l} value={l}>
                        {CONSTRAINT_LEVELS[l]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                {weight !== undefined && (
                  <div className="flex items-center gap-2">
                    {isConsider ? (
                      <>
                        <Slider
                          value={[weight]}
                          min={1}
                          max={100}
                          step={5}
                          onValueChange={(v) =>
                            handleWeightChange(field.key, v)
                          }
                          className="w-24"
                        />
                        <span className="text-muted-foreground w-8 text-xs">
                          {weight}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        {level === "forbidden" ? "100000" : "0"}
                      </span>
                    )}
                  </div>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
