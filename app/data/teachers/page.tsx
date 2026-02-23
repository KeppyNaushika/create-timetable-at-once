"use client"

import { Plus, Trash2, Briefcase } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layout/PageHeader"
import { AvailabilityGrid } from "@/components/timetable/AvailabilityGrid"
import { TeacherKomaList } from "@/components/timetable/TeacherKomaList"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useSchool } from "@/hooks/useSchool"
import { useSubjects } from "@/hooks/useSubjects"
import { useTeachers } from "@/hooks/useTeachers"
import type { Teacher } from "@/types/common.types"

export default function TeachersPage() {
  const {
    teachers,
    loading,
    createTeacher,
    updateTeacher,
    deleteTeacher,
    upsertAvailability,
  } = useTeachers()
  const { school } = useSchool()
  const { subjects } = useSubjects()

  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(
    null
  )

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId)

  useEffect(() => {
    if (teachers.length > 0 && !selectedTeacherId) {
      setSelectedTeacherId(teachers[0].id)
    }
  }, [teachers, selectedTeacherId])

  const handleCreateTeacher = useCallback(async () => {
    try {
      const created = await createTeacher({
        name: "新しい先生",
        nameKana: "",
        maxPeriodsPerWeek: 25,
      })
      setSelectedTeacherId(created.id)
      toast.success("先生を追加しました")
    } catch {
      toast.error("追加に失敗しました")
    }
  }, [createTeacher])

  const handleDeleteTeacher = useCallback(
    async (teacher: Teacher) => {
      try {
        await deleteTeacher(teacher.id)
        if (selectedTeacherId === teacher.id) {
          setSelectedTeacherId(null)
        }
        toast.success("先生を削除しました")
      } catch {
        toast.error("削除に失敗しました")
      }
    },
    [deleteTeacher, selectedTeacherId]
  )

  const handleUpdateField = useCallback(
    async (field: string, value: unknown) => {
      if (!selectedTeacher) return
      try {
        await updateTeacher(selectedTeacher.id, { [field]: value })
      } catch {
        toast.error("更新に失敗しました")
      }
    },
    [selectedTeacher, updateTeacher]
  )

  const handleAvailabilityToggle = useCallback(
    async (dayOfWeek: number, period: number, newStatus: string) => {
      if (!selectedTeacher) return
      try {
        await upsertAvailability({
          teacherId: selectedTeacher.id,
          dayOfWeek,
          period,
          status: newStatus,
        })
      } catch {
        toast.error("都合の更新に失敗しました")
      }
    },
    [selectedTeacher, upsertAvailability]
  )

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="先生設定"
        description="先生の情報、都合、担当科目を設定します"
      >
        <Button onClick={handleCreateTeacher}>
          <Plus className="mr-1 h-4 w-4" />
          先生を追加
        </Button>
      </PageHeader>

      <div className="flex flex-1 overflow-hidden">
        {/* 左: 先生リスト */}
        <div className="w-56 border-r">
          <ScrollArea className="h-full">
            <div className="p-1.5">
              {teachers.map((teacher) => (
                <div
                  key={teacher.id}
                  role="button"
                  tabIndex={0}
                  className={`group flex w-full cursor-pointer items-center justify-between rounded px-2 py-1 text-left text-sm transition-colors ${
                    selectedTeacherId === teacher.id
                      ? "bg-accent font-medium"
                      : "hover:bg-accent/50"
                  }`}
                  onClick={() => setSelectedTeacherId(teacher.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      setSelectedTeacherId(teacher.id)
                  }}
                >
                  <span className="truncate">{teacher.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 shrink-0 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteTeacher(teacher)
                    }}
                  >
                    <Trash2 className="text-destructive h-3 w-3" />
                  </Button>
                </div>
              ))}
              {teachers.length === 0 && (
                <p className="text-muted-foreground py-4 text-center text-xs">
                  先生がいません
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* 右: 詳細（縦並び） */}
        <div className="flex-1 overflow-auto">
          {selectedTeacher ? (
            <div className="space-y-4 p-6">
              {/* 基本情報 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">基本情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>先生名</Label>
                      <Input
                        key={selectedTeacher.id + "-name"}
                        defaultValue={selectedTeacher.name}
                        onBlur={(e) =>
                          handleUpdateField("name", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ふりがな</Label>
                      <Input
                        key={selectedTeacher.id + "-nameKana"}
                        defaultValue={selectedTeacher.nameKana}
                        onBlur={(e) =>
                          handleUpdateField("nameKana", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>担当教科</Label>
                      <Select
                        value={selectedTeacher.mainSubjectId ?? "none"}
                        onValueChange={(v) =>
                          handleUpdateField(
                            "mainSubjectId",
                            v === "none" ? null : v
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">未設定</SelectItem>
                          {subjects.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>週当たり最大コマ数</Label>
                      <Input
                        key={selectedTeacher.id + "-maxPeriodsPerWeek"}
                        type="number"
                        min={1}
                        max={40}
                        defaultValue={selectedTeacher.maxPeriodsPerWeek}
                        onBlur={(e) =>
                          handleUpdateField(
                            "maxPeriodsPerWeek",
                            parseInt(e.target.value) || 25
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>連続授業の最大数</Label>
                      <Input
                        key={selectedTeacher.id + "-maxConsecutive"}
                        type="number"
                        min={1}
                        max={10}
                        defaultValue={selectedTeacher.maxConsecutive}
                        onBlur={(e) =>
                          handleUpdateField(
                            "maxConsecutive",
                            parseInt(e.target.value) || 6
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>1日の最大授業数</Label>
                      <Input
                        key={selectedTeacher.id + "-maxPerDay"}
                        type="number"
                        min={1}
                        max={10}
                        defaultValue={selectedTeacher.maxPerDay}
                        onBlur={(e) =>
                          handleUpdateField(
                            "maxPerDay",
                            parseInt(e.target.value) || 6
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>備考</Label>
                    <Input
                      key={selectedTeacher.id + "-notes"}
                      defaultValue={selectedTeacher.notes}
                      onBlur={(e) =>
                        handleUpdateField("notes", e.target.value)
                      }
                    />
                  </div>
                  {(selectedTeacher.teacherDuties?.length ?? 0) > 0 && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" />
                        携わる校務
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedTeacher.teacherDuties?.map((td) => (
                          <Badge key={td.id} variant="secondary">
                            {td.duty?.name ?? "不明"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 都合 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">都合</CardTitle>
                </CardHeader>
                <CardContent>
                  <AvailabilityGrid
                    teacherId={selectedTeacher.id}
                    daysPerWeek={school?.daysPerWeek ?? 5}
                    maxPeriodsPerDay={school?.maxPeriodsPerDay ?? 6}
                    hasZeroPeriod={school?.hasZeroPeriod ?? false}
                    availabilities={selectedTeacher.availabilities ?? []}
                    onToggle={handleAvailabilityToggle}
                  />
                </CardContent>
              </Card>

              {/* 持ち駒 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">持ち駒</CardTitle>
                </CardHeader>
                <CardContent>
                  <TeacherKomaList teacherId={selectedTeacher.id} />
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">
                左のリストから先生を選択してください
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
