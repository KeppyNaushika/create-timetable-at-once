"use client"

import { Plus, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDuties } from "@/hooks/useDuties"
import { useSchool } from "@/hooks/useSchool"
import { useTeachers } from "@/hooks/useTeachers"
import { DAY_NAMES } from "@/lib/constants"
import type { Duty } from "@/types/common.types"

export default function DutiesPage() {
  const {
    duties,
    loading,
    createDuty,
    updateDuty,
    deleteDuty,
    setTeachersForDuty,
  } = useDuties()
  const { school } = useSchool()
  const { teachers } = useTeachers()

  const [selectedDutyId, setSelectedDutyId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formName, setFormName] = useState("")
  const [formShortName, setFormShortName] = useState("")
  const [formDayOfWeek, setFormDayOfWeek] = useState(0)
  const [formPeriod, setFormPeriod] = useState(1)

  const selectedDuty = duties.find((d) => d.id === selectedDutyId)

  useEffect(() => {
    if (duties.length > 0 && !selectedDutyId) {
      setSelectedDutyId(duties[0].id)
    }
  }, [duties, selectedDutyId])

  const handleCreateDuty = useCallback(async () => {
    if (!formName.trim()) {
      toast.error("校務名を入力してください")
      return
    }
    try {
      const created = await createDuty({
        name: formName,
        shortName: formShortName,
        dayOfWeek: formDayOfWeek,
        period: formPeriod,
      })
      setSelectedDutyId(created.id)
      setDialogOpen(false)
      setFormName("")
      setFormShortName("")
      setFormDayOfWeek(0)
      setFormPeriod(1)
      toast.success("校務を追加しました")
    } catch {
      toast.error("追加に失敗しました")
    }
  }, [formName, formShortName, formDayOfWeek, formPeriod, createDuty])

  const handleDeleteDuty = useCallback(
    async (duty: Duty) => {
      try {
        await deleteDuty(duty.id)
        if (selectedDutyId === duty.id) {
          setSelectedDutyId(null)
        }
        toast.success("校務を削除しました")
      } catch {
        toast.error("削除に失敗しました")
      }
    },
    [deleteDuty, selectedDutyId]
  )

  const handleUpdateField = useCallback(
    async (field: string, value: unknown) => {
      if (!selectedDuty) return
      try {
        await updateDuty(selectedDuty.id, { [field]: value })
      } catch {
        toast.error("更新に失敗しました")
      }
    },
    [selectedDuty, updateDuty]
  )

  const handleTeacherToggle = useCallback(
    async (teacherId: string, checked: boolean) => {
      if (!selectedDuty) return
      const currentTeacherIds =
        selectedDuty.teacherDuties?.map((td) => td.teacherId) ?? []
      const newTeacherIds = checked
        ? [...currentTeacherIds, teacherId]
        : currentTeacherIds.filter((id) => id !== teacherId)
      try {
        await setTeachersForDuty(selectedDuty.id, newTeacherIds)
      } catch {
        toast.error("担当先生の更新に失敗しました")
      }
    },
    [selectedDuty, setTeachersForDuty]
  )

  const daysPerWeek = school?.daysPerWeek ?? 5
  const maxPeriods = school?.maxPeriodsPerDay ?? 6

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
        title="校務設定"
        description="校務の情報と担当先生を設定します"
      >
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          校務を追加
        </Button>
      </PageHeader>

      <div className="flex flex-1 overflow-hidden">
        {/* 左: 校務リスト */}
        <div className="w-56 border-r">
          <ScrollArea className="h-full">
            <div className="space-y-1 p-2">
              {duties.map((duty) => (
                <div
                  key={duty.id}
                  role="button"
                  tabIndex={0}
                  className={`group flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    selectedDutyId === duty.id
                      ? "bg-accent font-medium"
                      : "hover:bg-accent/50"
                  }`}
                  onClick={() => setSelectedDutyId(duty.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setSelectedDutyId(duty.id)
                  }}
                >
                  <div>
                    <span>{duty.name}</span>
                    <span className="text-muted-foreground ml-1 text-xs">
                      ({DAY_NAMES[duty.dayOfWeek]}{duty.period})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteDuty(duty)
                    }}
                  >
                    <Trash2 className="text-destructive h-3 w-3" />
                  </Button>
                </div>
              ))}
              {duties.length === 0 && (
                <p className="text-muted-foreground py-4 text-center text-xs">
                  校務がありません
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* 右: 詳細 */}
        <div className="flex-1 overflow-auto">
          {selectedDuty ? (
            <div className="p-6">
              <Tabs defaultValue="info">
                <TabsList>
                  <TabsTrigger value="info">基本情報</TabsTrigger>
                  <TabsTrigger value="teachers">担当先生</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="mt-4 space-y-4">
                  <Card>
                    <CardContent className="space-y-4 pt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>校務名</Label>
                          <Input
                            key={selectedDuty.id + "-name"}
                            defaultValue={selectedDuty.name}
                            onBlur={(e) =>
                              handleUpdateField("name", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>略名</Label>
                          <Input
                            key={selectedDuty.id + "-shortName"}
                            defaultValue={selectedDuty.shortName}
                            onBlur={(e) =>
                              handleUpdateField("shortName", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>曜日</Label>
                          <Select
                            value={String(selectedDuty.dayOfWeek)}
                            onValueChange={(v) =>
                              handleUpdateField("dayOfWeek", parseInt(v))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DAY_NAMES.slice(0, daysPerWeek).map(
                                (day, i) => (
                                  <SelectItem key={i} value={String(i)}>
                                    {day}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>時限</Label>
                          <Select
                            value={String(selectedDuty.period)}
                            onValueChange={(v) =>
                              handleUpdateField("period", parseInt(v))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from(
                                { length: maxPeriods },
                                (_, i) => i + 1
                              ).map((p) => (
                                <SelectItem key={p} value={String(p)}>
                                  {p}時限
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="teachers" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>担当先生</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {teachers.map((teacher) => {
                          const isAssigned =
                            selectedDuty.teacherDuties?.some(
                              (td) => td.teacherId === teacher.id
                            ) ?? false
                          return (
                            <div
                              key={teacher.id}
                              className="flex items-center gap-2"
                            >
                              <Checkbox
                                id={`teacher-${teacher.id}`}
                                checked={isAssigned}
                                onCheckedChange={(checked) =>
                                  handleTeacherToggle(
                                    teacher.id,
                                    checked === true
                                  )
                                }
                              />
                              <Label
                                htmlFor={`teacher-${teacher.id}`}
                                className="cursor-pointer"
                              >
                                {teacher.name}
                              </Label>
                            </div>
                          )
                        })}
                        {teachers.length === 0 && (
                          <p className="text-muted-foreground text-sm">
                            先生が登録されていません
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">
                左のリストから校務を選択してください
              </p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>校務を追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>校務名</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="例: 給食指導"
              />
            </div>
            <div className="space-y-2">
              <Label>略名</Label>
              <Input
                value={formShortName}
                onChange={(e) => setFormShortName(e.target.value)}
                placeholder="例: 給"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>曜日</Label>
                <Select
                  value={String(formDayOfWeek)}
                  onValueChange={(v) => setFormDayOfWeek(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAY_NAMES.slice(0, daysPerWeek).map((day, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>時限</Label>
                <Select
                  value={String(formPeriod)}
                  onValueChange={(v) => setFormPeriod(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: maxPeriods }, (_, i) => i + 1).map(
                      (p) => (
                        <SelectItem key={p} value={String(p)}>
                          {p}時限
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleCreateDuty}>追加</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
