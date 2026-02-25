"use client"

import { ArrowLeft, Calendar, Loader2, Save } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useCallback, useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDailyChanges } from "@/hooks/useDailyChanges"
import { useDailySchedule } from "@/hooks/useDailySchedule"
import { useTimetableData } from "@/hooks/useTimetableData"

const SCHEDULE_TYPES = [
  { value: "normal", label: "通常" },
  { value: "shortened", label: "短縮" },
  { value: "exam", label: "考査" },
  { value: "event", label: "行事" },
  { value: "holiday", label: "休日" },
  { value: "custom", label: "その他" },
]

const CHANGE_TYPES = [
  { value: "cancel", label: "休講" },
  { value: "substitute", label: "補欠" },
  { value: "swap", label: "振替" },
  { value: "special", label: "特別" },
  { value: "self_study", label: "自習" },
]

function DailyEditContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const date = searchParams.get("date") ?? ""

  const {
    currentSchedule,
    loading: scheduleLoading,
    fetchByDate,
    upsertSchedule,
  } = useDailySchedule()
  const {
    changes,
    loading: changesLoading,
    fetchChanges,
    createChange,
    deleteChange,
  } = useDailyChanges()
  const { data: timetableData, loading: timetableLoading } = useTimetableData()

  const [scheduleType, setScheduleType] = useState("normal")
  const [periodsCount, setPeriodsCount] = useState<number | null>(null)
  const [reason, setReason] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  // New change form state
  const [newChangeClassId, setNewChangeClassId] = useState("")
  const [newChangePeriod, setNewChangePeriod] = useState(1)
  const [newChangeType, setNewChangeType] = useState("cancel")
  const [newChangeSubTeacherId, setNewChangeSubTeacherId] = useState("")

  // Load schedule for date
  useEffect(() => {
    if (date) {
      fetchByDate(date)
    }
  }, [date, fetchByDate])

  // Populate form when schedule loads
  useEffect(() => {
    if (currentSchedule) {
      setScheduleType(currentSchedule.scheduleType)
      setPeriodsCount(currentSchedule.periodsCount)
      setReason(currentSchedule.reason)
      setNotes(currentSchedule.notes)
      fetchChanges(currentSchedule.id)
    }
  }, [currentSchedule, fetchChanges])

  // Build teacher/class lookups
  const teacherMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const t of timetableData.teachers) {
      map.set(t.id, t.name)
    }
    return map
  }, [timetableData.teachers])

  const classMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of timetableData.classes) {
      map.set(c.id, c.name)
    }
    return map
  }, [timetableData.classes])

  // Timetable view: find what's assigned on this date's day of week
  const dayOfWeek = useMemo(() => {
    if (!date) return -1
    const d = new Date(date)
    const dow = d.getDay() // 0=Sun
    return dow === 0 ? 7 : dow // 1=Mon...7=Sun
  }, [date])

  const dailySlots = useMemo(() => {
    if (!timetableData.adoptedPattern) return []
    return timetableData.slots.filter((s) => s.dayOfWeek === dayOfWeek)
  }, [timetableData.slots, timetableData.adoptedPattern, dayOfWeek])

  const handleSave = useCallback(async () => {
    if (!date) return
    setSaving(true)
    try {
      await upsertSchedule({
        date,
        scheduleType,
        periodsCount,
        reason,
        notes,
      })
    } finally {
      setSaving(false)
    }
  }, [date, scheduleType, periodsCount, reason, notes, upsertSchedule])

  const handleAddChange = useCallback(async () => {
    if (!currentSchedule || !newChangeClassId) return
    await createChange({
      dailyScheduleId: currentSchedule.id,
      classId: newChangeClassId,
      period: newChangePeriod,
      changeType: newChangeType,
      substituteTeacherId: newChangeSubTeacherId || null,
      notes: "",
    })
    setNewChangeClassId("")
    setNewChangeSubTeacherId("")
  }, [
    currentSchedule,
    newChangeClassId,
    newChangePeriod,
    newChangeType,
    newChangeSubTeacherId,
    createChange,
  ])

  const isLoading = scheduleLoading || timetableLoading

  if (!date) {
    return (
      <div className="text-muted-foreground p-8 text-center">
        日付が指定されていません
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/daily/calendar")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            <Calendar className="mr-2 inline h-5 w-5" />
            {date} の日課
          </h1>
          <p className="text-muted-foreground text-sm">
            日課種別の設定と変更の管理
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Schedule type form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">日課設定</CardTitle>
              <CardDescription>この日の日課種別を設定します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>日課種別</Label>
                <select
                  aria-label="日課種別"
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                  value={scheduleType}
                  onChange={(e) => setScheduleType(e.target.value)}
                >
                  {SCHEDULE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="periods-count">時限数</Label>
                <Input
                  id="periods-count"
                  type="number"
                  min={0}
                  max={10}
                  value={periodsCount ?? ""}
                  onChange={(e) =>
                    setPeriodsCount(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  placeholder="未指定（通常）"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">理由</Label>
                <Input
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="例: 体育祭"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="daily-notes">備考</Label>
                <textarea
                  id="daily-notes"
                  className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-15 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="備考を入力"
                />
              </div>

              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                保存
              </Button>
            </CardContent>
          </Card>

          {/* Daily timetable view */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">この日の時間割</CardTitle>
              <CardDescription>
                採用パターンの{DAY_OF_WEEK_LABELS[dayOfWeek] ?? ""}の配置 (
                {dailySlots.length}コマ)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dailySlots.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  この日の配置データがありません
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>時限</TableHead>
                      <TableHead>科目</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailySlots
                      .sort((a, b) => a.period - b.period)
                      .map((slot) => {
                        const koma = timetableData.komas.find(
                          (k) => k.id === slot.komaId
                        )
                        const subject = koma
                          ? timetableData.subjects.find(
                              (s) => s.id === koma.subjectId
                            )
                          : null
                        return (
                          <TableRow key={slot.id}>
                            <TableCell className="font-medium">
                              {slot.period}限
                            </TableCell>
                            <TableCell>
                              {subject ? (
                                <Badge
                                  variant="outline"
                                  style={
                                    subject.color
                                      ? {
                                          borderColor: subject.color,
                                          color: subject.color,
                                        }
                                      : undefined
                                  }
                                >
                                  {subject.shortName || subject.name}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">
                                  --
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Changes management */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">変更一覧</CardTitle>
                  <CardDescription>
                    補欠・振替・休講などの変更を管理します
                  </CardDescription>
                </div>
                <Badge variant="secondary">{changes.length}件</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add change form */}
              {currentSchedule && (
                <div className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
                  <div className="space-y-1">
                    <Label className="text-xs">クラス</Label>
                    <select
                      aria-label="クラス"
                      className="border-input bg-background h-9 w-30 rounded-md border px-2 text-sm"
                      value={newChangeClassId}
                      onChange={(e) => setNewChangeClassId(e.target.value)}
                    >
                      <option value="">選択...</option>
                      {timetableData.classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">時限</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      className="w-17.5"
                      value={newChangePeriod}
                      onChange={(e) =>
                        setNewChangePeriod(Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">種別</Label>
                    <select
                      aria-label="変更種別"
                      className="border-input bg-background h-9 w-25 rounded-md border px-2 text-sm"
                      value={newChangeType}
                      onChange={(e) => setNewChangeType(e.target.value)}
                    >
                      {CHANGE_TYPES.map((ct) => (
                        <option key={ct.value} value={ct.value}>
                          {ct.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">補欠教員</Label>
                    <select
                      aria-label="補欠教員"
                      className="border-input bg-background h-9 w-35 rounded-md border px-2 text-sm"
                      value={newChangeSubTeacherId}
                      onChange={(e) => setNewChangeSubTeacherId(e.target.value)}
                    >
                      <option value="">なし</option>
                      {timetableData.teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAddChange}
                    disabled={!newChangeClassId}
                  >
                    追加
                  </Button>
                </div>
              )}

              {/* Changes list */}
              {changesLoading ? (
                <div className="flex h-16 items-center justify-center">
                  <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
                </div>
              ) : changes.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  変更はありません
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>クラス</TableHead>
                      <TableHead>時限</TableHead>
                      <TableHead>種別</TableHead>
                      <TableHead>補欠教員</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {changes.map((change) => (
                      <TableRow key={change.id}>
                        <TableCell>
                          {classMap.get(change.classId) ?? change.classId}
                        </TableCell>
                        <TableCell>{change.period}限</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {CHANGE_TYPES.find(
                              (ct) => ct.value === change.changeType
                            )?.label ?? change.changeType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {change.substituteTeacherId
                            ? (teacherMap.get(change.substituteTeacherId) ??
                              change.substituteTeacherId)
                            : "--"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteChange(change.id)}
                          >
                            削除
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

const DAY_OF_WEEK_LABELS: Record<number, string> = {
  1: "月曜",
  2: "火曜",
  3: "水曜",
  4: "木曜",
  5: "金曜",
  6: "土曜",
  7: "日曜",
}

export default function DailyEditPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      }
    >
      <DailyEditContent />
    </Suspense>
  )
}
