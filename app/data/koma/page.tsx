"use client"

import { Copy, Plus, Trash2 } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layout/PageHeader"
import { Badge } from "@/components/ui/badge"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useClasses } from "@/hooks/useClasses"
import { useKomas } from "@/hooks/useKomas"
import { useRooms } from "@/hooks/useRooms"
import { useSubjects } from "@/hooks/useSubjects"
import { useTeachers } from "@/hooks/useTeachers"
import { KOMA_TEACHER_ROLES, KOMA_TYPES } from "@/lib/constants"
import {
  CURRICULUM_PRESETS,
  generateKomasFromPreset,
} from "@/lib/komaGenerator"
import type { Grade, Koma } from "@/types/common.types"

export default function KomaPage() {
  const { grades, classes } = useClasses()
  const { subjects } = useSubjects()
  const { teachers } = useTeachers()
  const { rooms } = useRooms()

  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null)

  // selectedGradeId に基づいて useKomas を呼ぶ
  const {
    komas,
    loading,
    createKoma,
    updateKoma,
    deleteKoma,
    duplicateKoma,
    setKomaTeachers,
    setKomaClasses,
    setKomaRooms,
    batchCreateKomas,
    deleteKomasByGrade,
  } = useKomas(selectedGradeId ?? undefined)

  const [selectedKomaId, setSelectedKomaId] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [batchDialogOpen, setBatchDialogOpen] = useState(false)

  const selectedKoma = komas.find((k) => k.id === selectedKomaId)

  // 学年が変わったら先頭の駒を選択
  useEffect(() => {
    if (grades.length > 0 && !selectedGradeId) {
      setSelectedGradeId(grades[0].id)
    }
  }, [grades, selectedGradeId])

  useEffect(() => {
    setSelectedKomaId(null)
  }, [selectedGradeId])

  useEffect(() => {
    if (komas.length > 0 && !selectedKomaId) {
      setSelectedKomaId(komas[0].id)
    }
  }, [komas, selectedKomaId])

  // 教科別にグループ化
  const komasBySubject = useMemo(() => {
    const groups: Record<
      string,
      { subject: { id: string; name: string; color: string }; komas: Koma[] }
    > = {}
    for (const koma of komas) {
      const subjectId = koma.subjectId
      if (!groups[subjectId]) {
        groups[subjectId] = {
          subject: koma.subject ?? {
            id: subjectId,
            name: "不明",
            color: "#999",
          },
          komas: [],
        }
      }
      groups[subjectId].komas.push(koma)
    }
    return Object.values(groups)
  }, [komas])

  // 該当学年のクラス
  const gradeClasses = useMemo(
    () => classes.filter((c) => c.gradeId === selectedGradeId),
    [classes, selectedGradeId]
  )

  const handleCreateKoma = useCallback(async () => {
    if (!selectedGradeId || subjects.length === 0) return
    try {
      const created = await createKoma({
        subjectId: subjects[0].id,
        gradeId: selectedGradeId,
      })
      setSelectedKomaId(created.id)
      setCreateDialogOpen(false)
      toast.success("駒を追加しました")
    } catch {
      toast.error("追加に失敗しました")
    }
  }, [selectedGradeId, subjects, createKoma])

  const handleDeleteKoma = useCallback(
    async (koma: Koma) => {
      try {
        await deleteKoma(koma.id)
        if (selectedKomaId === koma.id) {
          setSelectedKomaId(null)
        }
        toast.success("駒を削除しました")
      } catch {
        toast.error("削除に失敗しました")
      }
    },
    [deleteKoma, selectedKomaId]
  )

  const handleDuplicateKoma = useCallback(
    async (koma: Koma) => {
      try {
        const duplicated = await duplicateKoma(koma.id)
        if (duplicated) setSelectedKomaId(duplicated.id)
        toast.success("駒をコピーしました")
      } catch {
        toast.error("コピーに失敗しました")
      }
    },
    [duplicateKoma]
  )

  const handleUpdateField = useCallback(
    async (field: string, value: unknown) => {
      if (!selectedKoma) return
      try {
        await updateKoma(selectedKoma.id, { [field]: value })
      } catch {
        toast.error("更新に失敗しました")
      }
    },
    [selectedKoma, updateKoma]
  )

  const handleTeacherToggle = useCallback(
    async (teacherId: string, checked: boolean) => {
      if (!selectedKoma) return
      const current = selectedKoma.komaTeachers ?? []
      const newTeachers = checked
        ? [
            ...current.map((kt) => ({
              teacherId: kt.teacherId,
              role: kt.role,
            })),
            { teacherId, role: "main" },
          ]
        : current
            .filter((kt) => kt.teacherId !== teacherId)
            .map((kt) => ({ teacherId: kt.teacherId, role: kt.role }))
      try {
        await setKomaTeachers(selectedKoma.id, newTeachers)
      } catch {
        toast.error("先生の設定に失敗しました")
      }
    },
    [selectedKoma, setKomaTeachers]
  )

  const handleTeacherRoleChange = useCallback(
    async (teacherId: string, role: string) => {
      if (!selectedKoma) return
      const current = selectedKoma.komaTeachers ?? []
      const newTeachers = current.map((kt) => ({
        teacherId: kt.teacherId,
        role: kt.teacherId === teacherId ? role : kt.role,
      }))
      try {
        await setKomaTeachers(selectedKoma.id, newTeachers)
      } catch {
        toast.error("役割の変更に失敗しました")
      }
    },
    [selectedKoma, setKomaTeachers]
  )

  const handleClassToggle = useCallback(
    async (classId: string, checked: boolean) => {
      if (!selectedKoma) return
      const currentIds = selectedKoma.komaClasses?.map((kc) => kc.classId) ?? []
      const newIds = checked
        ? [...currentIds, classId]
        : currentIds.filter((id) => id !== classId)
      try {
        await setKomaClasses(selectedKoma.id, newIds)
      } catch {
        toast.error("クラスの設定に失敗しました")
      }
    },
    [selectedKoma, setKomaClasses]
  )

  const handleRoomToggle = useCallback(
    async (roomId: string, checked: boolean) => {
      if (!selectedKoma) return
      const currentIds = selectedKoma.komaRooms?.map((kr) => kr.roomId) ?? []
      const newIds = checked
        ? [...currentIds, roomId]
        : currentIds.filter((id) => id !== roomId)
      try {
        await setKomaRooms(selectedKoma.id, newIds)
      } catch {
        toast.error("教室の設定に失敗しました")
      }
    },
    [selectedKoma, setKomaRooms]
  )

  // 一括生成
  const [batchGradeId, setBatchGradeId] = useState<string>("")
  const [batchPreset, setBatchPreset] = useState<
    Record<string, { count: number; type: string; enabled: boolean }>
  >({})

  const handleLoadPreset = useCallback(
    (gradeNum: number) => {
      const preset = CURRICULUM_PRESETS[gradeNum]
      if (!preset) return
      const map: Record<
        string,
        { count: number; type: string; enabled: boolean }
      > = {}
      for (const item of preset) {
        const subject = subjects.find((s) => s.name === item.subjectName)
        if (subject) {
          map[subject.id] = {
            count: item.weeklyHours,
            type: item.type ?? "normal",
            enabled: true,
          }
        }
      }
      setBatchPreset(map)
    },
    [subjects]
  )

  const handleBatchGenerate = useCallback(async () => {
    if (!batchGradeId) return
    const grade = grades.find((g) => g.id === batchGradeId)
    if (!grade) return

    const komasToCreate = generateKomasFromPreset(
      batchPreset,
      batchGradeId,
      subjects
    )

    if (komasToCreate.length === 0) {
      toast.error("生成する駒がありません")
      return
    }

    try {
      await batchCreateKomas(komasToCreate)
      setBatchDialogOpen(false)
      toast.success(`${komasToCreate.length}件の駒を生成しました`)
    } catch {
      toast.error("一括生成に失敗しました")
    }
  }, [batchGradeId, batchPreset, grades, subjects, batchCreateKomas])

  if (loading && grades.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="駒設定" description="各学年の教科駒を設定します">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBatchDialogOpen(true)}>
            一括生成
          </Button>
          <Button onClick={handleCreateKoma}>
            <Plus className="mr-1 h-4 w-4" />
            駒を追加
          </Button>
        </div>
      </PageHeader>

      {/* 学年タブ */}
      <div className="border-b px-6">
        <div className="flex gap-2">
          {grades.map((grade) => (
            <button
              key={grade.id}
              type="button"
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                selectedGradeId === grade.id
                  ? "border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground border-transparent"
              }`}
              onClick={() => setSelectedGradeId(grade.id)}
            >
              {grade.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 左: 駒リスト (教科グループ別) */}
        <div className="w-64 border-r">
          <ScrollArea className="h-full">
            <div className="p-2">
              {komasBySubject.map((group) => (
                <div key={group.subject.id} className="mb-3">
                  <div className="mb-1 flex items-center gap-1 px-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: group.subject.color }}
                    />
                    <span className="text-xs font-semibold">
                      {group.subject.name}
                    </span>
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      {group.komas.reduce((sum, k) => sum + k.count, 0)}h
                    </Badge>
                  </div>
                  {group.komas.map((koma) => (
                    <button
                      key={koma.id}
                      type="button"
                      className={`flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                        selectedKomaId === koma.id
                          ? "bg-accent font-medium"
                          : "hover:bg-accent/50"
                      }`}
                      onClick={() => setSelectedKomaId(koma.id)}
                    >
                      <span className="truncate">
                        {koma.label || group.subject.name}
                        {koma.type === "consecutive" && (
                          <span className="text-muted-foreground ml-1 text-[10px]">
                            (連続)
                          </span>
                        )}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {koma.count}h
                      </span>
                    </button>
                  ))}
                </div>
              ))}
              {komas.length === 0 && (
                <p className="text-muted-foreground py-4 text-center text-xs">
                  駒がありません
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* 右: 詳細 */}
        <div className="flex-1 overflow-auto">
          {selectedKoma ? (
            <div className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDuplicateKoma(selectedKoma)}
                >
                  <Copy className="mr-1 h-3 w-3" />
                  コピー
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => handleDeleteKoma(selectedKoma)}
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  削除
                </Button>
              </div>

              <Tabs defaultValue="info">
                <TabsList>
                  <TabsTrigger value="info">基本情報</TabsTrigger>
                  <TabsTrigger value="teachers">先生</TabsTrigger>
                  <TabsTrigger value="classes">クラス</TabsTrigger>
                  <TabsTrigger value="rooms">教室</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="mt-4 space-y-4">
                  <Card>
                    <CardContent className="space-y-4 pt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>科目</Label>
                          <Select
                            value={selectedKoma.subjectId}
                            onValueChange={(v) =>
                              handleUpdateField("subjectId", v)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {subjects.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>種類</Label>
                          <RadioGroup
                            value={selectedKoma.type}
                            onValueChange={(v) => handleUpdateField("type", v)}
                            className="flex gap-4"
                          >
                            {Object.entries(KOMA_TYPES).map(
                              ([value, label]) => (
                                <div
                                  key={value}
                                  className="flex items-center gap-1.5"
                                >
                                  <RadioGroupItem
                                    value={value}
                                    id={`type-${value}`}
                                  />
                                  <Label htmlFor={`type-${value}`}>
                                    {label}
                                  </Label>
                                </div>
                              )
                            )}
                          </RadioGroup>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>駒数 (週)</Label>
                          <Input
                            key={selectedKoma.id + "-count"}
                            type="number"
                            min={0}
                            max={10}
                            defaultValue={selectedKoma.count}
                            onBlur={(e) =>
                              handleUpdateField(
                                "count",
                                parseInt(e.target.value) || 1
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>優先順位 (0-9)</Label>
                          <Input
                            key={selectedKoma.id + "-priority"}
                            type="number"
                            min={0}
                            max={9}
                            defaultValue={selectedKoma.priority}
                            onBlur={(e) =>
                              handleUpdateField(
                                "priority",
                                parseInt(e.target.value) || 5
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>ラベル</Label>
                          <Input
                            key={selectedKoma.id + "-label"}
                            defaultValue={selectedKoma.label}
                            onBlur={(e) =>
                              handleUpdateField("label", e.target.value)
                            }
                            placeholder="任意"
                          />
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
                          const kt = selectedKoma.komaTeachers?.find(
                            (kt) => kt.teacherId === teacher.id
                          )
                          const isAssigned = !!kt
                          return (
                            <div
                              key={teacher.id}
                              className="flex items-center gap-3"
                            >
                              <Checkbox
                                id={`koma-teacher-${teacher.id}`}
                                checked={isAssigned}
                                onCheckedChange={(checked) =>
                                  handleTeacherToggle(
                                    teacher.id,
                                    checked === true
                                  )
                                }
                              />
                              <Label
                                htmlFor={`koma-teacher-${teacher.id}`}
                                className="flex-1 cursor-pointer"
                              >
                                {teacher.name}
                              </Label>
                              {isAssigned && (
                                <Select
                                  value={kt.role}
                                  onValueChange={(v) =>
                                    handleTeacherRoleChange(teacher.id, v)
                                  }
                                >
                                  <SelectTrigger className="w-20">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(KOMA_TEACHER_ROLES).map(
                                      ([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                          {label}
                                        </SelectItem>
                                      )
                                    )}
                                  </SelectContent>
                                </Select>
                              )}
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

                <TabsContent value="classes" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>対象クラス</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {gradeClasses.map((cls) => {
                          const isAssigned =
                            selectedKoma.komaClasses?.some(
                              (kc) => kc.classId === cls.id
                            ) ?? false
                          return (
                            <div
                              key={cls.id}
                              className="flex items-center gap-2"
                            >
                              <Checkbox
                                id={`koma-class-${cls.id}`}
                                checked={isAssigned}
                                onCheckedChange={(checked) =>
                                  handleClassToggle(cls.id, checked === true)
                                }
                              />
                              <Label
                                htmlFor={`koma-class-${cls.id}`}
                                className="cursor-pointer"
                              >
                                {cls.name}
                              </Label>
                            </div>
                          )
                        })}
                        {gradeClasses.length === 0 && (
                          <p className="text-muted-foreground text-sm">
                            この学年にクラスがありません
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="rooms" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>使用教室</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {rooms.map((room) => {
                          const isAssigned =
                            selectedKoma.komaRooms?.some(
                              (kr) => kr.roomId === room.id
                            ) ?? false
                          return (
                            <div
                              key={room.id}
                              className="flex items-center gap-2"
                            >
                              <Checkbox
                                id={`koma-room-${room.id}`}
                                checked={isAssigned}
                                onCheckedChange={(checked) =>
                                  handleRoomToggle(room.id, checked === true)
                                }
                              />
                              <Label
                                htmlFor={`koma-room-${room.id}`}
                                className="cursor-pointer"
                              >
                                {room.name}
                              </Label>
                            </div>
                          )
                        })}
                        {rooms.length === 0 && (
                          <p className="text-muted-foreground text-sm">
                            特別教室が登録されていません
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
                {komas.length > 0
                  ? "左のリストから駒を選択してください"
                  : "「駒を追加」または「一括生成」で駒を作成してください"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 一括生成ダイアログ */}
      <BatchGenerateDialog
        open={batchDialogOpen}
        onOpenChange={setBatchDialogOpen}
        grades={grades}
        subjects={subjects}
        batchGradeId={batchGradeId}
        setBatchGradeId={setBatchGradeId}
        batchPreset={batchPreset}
        setBatchPreset={setBatchPreset}
        onLoadPreset={handleLoadPreset}
        onGenerate={handleBatchGenerate}
        onDeleteExisting={deleteKomasByGrade}
      />

      {/* 新規駒ダイアログ */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>駒を追加</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            選択中の学年に新しい駒を追加します。追加後に詳細を設定してください。
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button onClick={handleCreateKoma}>追加</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 一括生成ダイアログ
function BatchGenerateDialog({
  open,
  onOpenChange,
  grades,
  subjects,
  batchGradeId,
  setBatchGradeId,
  batchPreset,
  setBatchPreset,
  onLoadPreset,
  onGenerate,
  onDeleteExisting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  grades: Grade[]
  subjects: { id: string; name: string }[]
  batchGradeId: string
  setBatchGradeId: (id: string) => void
  batchPreset: Record<string, { count: number; type: string; enabled: boolean }>
  setBatchPreset: (
    preset: Record<string, { count: number; type: string; enabled: boolean }>
  ) => void
  onLoadPreset: (gradeNum: number) => void
  onGenerate: () => void
  onDeleteExisting: (gradeId: string) => Promise<void>
}) {
  const selectedGrade = grades.find((g) => g.id === batchGradeId)

  const handleDeleteAndGenerate = useCallback(async () => {
    if (batchGradeId) {
      await onDeleteExisting(batchGradeId)
    }
    onGenerate()
  }, [batchGradeId, onDeleteExisting, onGenerate])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>駒の一括生成</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label>対象学年</Label>
              <Select value={batchGradeId} onValueChange={setBatchGradeId}>
                <SelectTrigger>
                  <SelectValue placeholder="学年を選択" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                if (selectedGrade) onLoadPreset(selectedGrade.gradeNum)
              }}
              disabled={!selectedGrade}
            >
              プリセット読込
            </Button>
          </div>

          {Object.keys(batchPreset).length > 0 && (
            <div className="max-h-80 overflow-auto rounded border">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left">教科</th>
                    <th className="w-20 p-2 text-center">週時間</th>
                    <th className="w-24 p-2 text-center">種類</th>
                    <th className="w-16 p-2 text-center">生成</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects
                    .filter((s) => batchPreset[s.id])
                    .map((subject) => {
                      const preset = batchPreset[subject.id]
                      return (
                        <tr key={subject.id} className="border-t">
                          <td className="p-2">{subject.name}</td>
                          <td className="p-2 text-center">
                            <Input
                              type="number"
                              min={0}
                              max={10}
                              className="h-7 w-16 text-center"
                              value={preset.count}
                              onChange={(e) => {
                                setBatchPreset({
                                  ...batchPreset,
                                  [subject.id]: {
                                    ...preset,
                                    count: parseInt(e.target.value) || 0,
                                  },
                                })
                              }}
                            />
                          </td>
                          <td className="p-2 text-center">
                            <Select
                              value={preset.type}
                              onValueChange={(v) => {
                                setBatchPreset({
                                  ...batchPreset,
                                  [subject.id]: { ...preset, type: v },
                                })
                              }}
                            >
                              <SelectTrigger className="h-7 w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(KOMA_TYPES).map(
                                  ([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-2 text-center">
                            <Checkbox
                              checked={preset.enabled}
                              onCheckedChange={(checked) => {
                                setBatchPreset({
                                  ...batchPreset,
                                  [subject.id]: {
                                    ...preset,
                                    enabled: checked === true,
                                  },
                                })
                              }}
                            />
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAndGenerate}
              disabled={!batchGradeId || Object.keys(batchPreset).length === 0}
            >
              既存を削除して生成
            </Button>
            <Button
              onClick={onGenerate}
              disabled={!batchGradeId || Object.keys(batchPreset).length === 0}
            >
              追加生成
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
