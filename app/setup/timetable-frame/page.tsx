"use client"

import React, { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { useSchool } from "@/hooks/useSchool"
import { DAY_NAMES } from "@/lib/constants"

export default function TimetableFramePage() {
  const { school, loading, updateSchool, fetchSchool } = useSchool()

  const [daysPerWeek, setDaysPerWeek] = useState(5)
  const [maxPeriodsPerDay, setMaxPeriodsPerDay] = useState(6)
  const [hasZeroPeriod, setHasZeroPeriod] = useState(false)
  const [lunchAfterPeriod, setLunchAfterPeriod] = useState(4)
  const [periodNames, setPeriodNames] = useState<string[]>([])
  const [periodLengths, setPeriodLengths] = useState<number[]>([])
  const [disabledSlots, setDisabledSlots] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (school) {
      setDaysPerWeek(school.daysPerWeek)
      setMaxPeriodsPerDay(school.maxPeriodsPerDay)
      setHasZeroPeriod(school.hasZeroPeriod)
      setLunchAfterPeriod(school.lunchAfterPeriod)
      try {
        const names = JSON.parse(school.periodNamesJson)
        const lengths = JSON.parse(school.periodLengthsJson)
        if (Array.isArray(names) && names.length > 0) setPeriodNames(names)
        if (Array.isArray(lengths) && lengths.length > 0)
          setPeriodLengths(lengths)
      } catch {
        // use defaults
      }
      try {
        const disabled = JSON.parse(school.disabledSlotsJson)
        if (Array.isArray(disabled)) {
          setDisabledSlots(
            new Set(
              disabled.map(
                (s: { dayOfWeek: number; period: number }) =>
                  `${s.dayOfWeek}:${s.period}`
              )
            )
          )
        }
      } catch {
        // use defaults
      }
    }
  }, [school])

  // maxPeriodsPerDay変更時にperiodNames/periodLengthsを調整
  useEffect(() => {
    const totalPeriods = hasZeroPeriod ? maxPeriodsPerDay + 1 : maxPeriodsPerDay
    setPeriodNames((prev) => {
      const newNames = [...prev]
      while (newNames.length < totalPeriods) {
        const periodNum = hasZeroPeriod ? newNames.length : newNames.length + 1
        newNames.push(`${periodNum}時限目`)
      }
      return newNames.slice(0, totalPeriods)
    })
    setPeriodLengths((prev) => {
      const newLengths = [...prev]
      while (newLengths.length < totalPeriods) {
        newLengths.push(50)
      }
      return newLengths.slice(0, totalPeriods)
    })
  }, [maxPeriodsPerDay, hasZeroPeriod])

  const handleSave = useCallback(async () => {
    if (!school) return
    setSaving(true)
    try {
      const disabledSlotsArray = Array.from(disabledSlots).map((key) => {
        const [d, p] = key.split(":")
        return { dayOfWeek: Number(d), period: Number(p) }
      })
      await updateSchool(school.id, {
        daysPerWeek,
        maxPeriodsPerDay,
        hasZeroPeriod,
        lunchAfterPeriod,
        periodNamesJson: JSON.stringify(periodNames),
        periodLengthsJson: JSON.stringify(periodLengths),
        disabledSlotsJson: JSON.stringify(disabledSlotsArray),
      })
      await fetchSchool()
      toast.success("時間割枠を保存しました")
    } catch {
      toast.error("保存に失敗しました")
    } finally {
      setSaving(false)
    }
  }, [
    school,
    daysPerWeek,
    maxPeriodsPerDay,
    hasZeroPeriod,
    lunchAfterPeriod,
    periodNames,
    periodLengths,
    disabledSlots,
    updateSchool,
    fetchSchool,
  ])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  const displayDays = DAY_NAMES.slice(0, daysPerWeek)

  return (
    <div>
      <PageHeader
        title="基本時間割枠"
        description="週制、時限数、帯長などを設定します"
      >
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "保存中..." : "保存"}
        </Button>
      </PageHeader>

      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>週制・時限設定</CardTitle>
            <CardDescription>
              週の日数、1日の時限数、0時限目の有無を設定します
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>週制</Label>
                <Select
                  value={String(daysPerWeek)}
                  onValueChange={(v) => setDaysPerWeek(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5日制</SelectItem>
                    <SelectItem value="6">6日制</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>1日の最大時限数</Label>
                <Input
                  type="number"
                  min={4}
                  max={8}
                  value={maxPeriodsPerDay}
                  onChange={(e) =>
                    setMaxPeriodsPerDay(parseInt(e.target.value) || 6)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>昼休み位置</Label>
                <Select
                  value={String(lunchAfterPeriod)}
                  onValueChange={(v) => setLunchAfterPeriod(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: maxPeriodsPerDay }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {i + 1}時限目の後
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="hasZeroPeriod"
                checked={hasZeroPeriod}
                onCheckedChange={(checked) =>
                  setHasZeroPeriod(checked === true)
                }
              />
              <Label htmlFor="hasZeroPeriod">0時限目を使用する</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>時限名称・帯長</CardTitle>
            <CardDescription>
              各時限の名称と長さ（分）を設定します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">時限</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead className="w-24">帯長（分）</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periodNames.map((name, i) => {
                  const periodNum = hasZeroPeriod ? i : i + 1
                  return (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        {periodNum === 0 ? "0" : periodNum}時限
                      </TableCell>
                      <TableCell>
                        <Input
                          value={name}
                          onChange={(e) =>
                            setPeriodNames((prev) => {
                              const next = [...prev]
                              next[i] = e.target.value
                              return next
                            })
                          }
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={10}
                          max={120}
                          value={periodLengths[i] ?? 50}
                          onChange={(e) =>
                            setPeriodLengths((prev) => {
                              const next = [...prev]
                              next[i] = parseInt(e.target.value) || 50
                              return next
                            })
                          }
                          className="h-8"
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>プレビュー</CardTitle>
            <CardDescription>
              セルをクリックすると無効化できます（無効スロットには授業を配置できません）
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20"></TableHead>
                    {displayDays.map((day) => (
                      <TableHead key={day} className="text-center">
                        {day}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periodNames.map((name, i) => {
                    const periodNum = hasZeroPeriod ? i : i + 1
                    const isLunchAfter = periodNum === lunchAfterPeriod
                    return (
                      <React.Fragment key={i}>
                        <TableRow>
                          <TableCell className="text-muted-foreground text-center text-xs">
                            {name}
                          </TableCell>
                          {displayDays.map((day, dayIndex) => {
                            const slotKey = `${dayIndex}:${periodNum}`
                            const isDisabled = disabledSlots.has(slotKey)
                            return (
                              <TableCell
                                key={day}
                                className={`h-10 cursor-pointer border text-center transition-colors select-none ${
                                  isDisabled
                                    ? "bg-muted text-muted-foreground"
                                    : "hover:bg-accent"
                                }`}
                                onClick={() => {
                                  setDisabledSlots((prev) => {
                                    const next = new Set(prev)
                                    if (next.has(slotKey)) {
                                      next.delete(slotKey)
                                    } else {
                                      next.add(slotKey)
                                    }
                                    return next
                                  })
                                }}
                              >
                                <span
                                  className={`text-xs ${
                                    isDisabled
                                      ? "text-muted-foreground font-medium"
                                      : "text-muted-foreground/40"
                                  }`}
                                >
                                  {isDisabled ? "×" : "-"}
                                </span>
                              </TableCell>
                            )
                          })}
                        </TableRow>
                        {isLunchAfter && (
                          <TableRow>
                            <TableCell
                              colSpan={displayDays.length + 1}
                              className="bg-muted/50 text-muted-foreground h-6 text-center text-xs"
                            >
                              昼休み
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
