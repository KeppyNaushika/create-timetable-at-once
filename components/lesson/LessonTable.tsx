"use client"

import { Plus, Trash2 } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"

import { KomaDetailDialog } from "@/components/lesson/KomaDetailDialog"
import { TeacherCell } from "@/components/lesson/TeacherCell"
import { TeacherSelectDialog } from "@/components/lesson/TeacherSelectDialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { buildSubjectRows } from "@/lib/lessonGrid"
import type {
  ClassInfo,
  Koma,
  SpecialRoom,
  Subject,
  Teacher,
} from "@/types/common.types"

interface LessonTableProps {
  gradeId: string
  komas: Koma[]
  subjects: Subject[]
  gradeClasses: ClassInfo[]
  teachers: Teacher[]
  rooms: SpecialRoom[]
  createKoma: (data: Record<string, unknown>) => Promise<Koma>
  updateKoma: (id: string, data: Record<string, unknown>) => Promise<Koma>
  deleteKoma: (id: string) => Promise<void>
  setKomaTeachers: (
    komaId: string,
    teachers: { teacherId: string; role: string }[]
  ) => Promise<void>
  setKomaClasses: (komaId: string, classIds: string[]) => Promise<void>
  setKomaRooms: (komaId: string, roomIds: string[]) => Promise<void>
  batchCreateKomas: (data: Record<string, unknown>[]) => Promise<Koma[]>
}

export function LessonTable({
  gradeId,
  komas,
  subjects,
  gradeClasses,
  teachers,
  rooms,
  createKoma,
  updateKoma,
  deleteKoma,
  setKomaTeachers,
  setKomaClasses,
  setKomaRooms,
  batchCreateKomas,
}: LessonTableProps) {
  // ダイアログ状態
  const [teacherDialogKomaId, setTeacherDialogKomaId] = useState<string | null>(
    null
  )
  const [detailDialogKomaId, setDetailDialogKomaId] = useState<string | null>(
    null
  )
  const [combineDialogKomaId, setCombineDialogKomaId] = useState<string | null>(
    null
  )
  const [addSubjectDialogOpen, setAddSubjectDialogOpen] = useState(false)

  // グリッドモデル計算
  const rows = useMemo(
    () => buildSubjectRows(komas, subjects, gradeClasses),
    [komas, subjects, gradeClasses]
  )

  // 表に含まれていない教科
  const unusedSubjects = useMemo(() => {
    const usedIds = new Set(rows.map((r) => r.subjectId))
    return subjects.filter(
      (s) => !usedIds.has(s.id) && s.category === "general"
    )
  }, [rows, subjects])

  // ダイアログ用の駒データ
  const teacherDialogKoma = komas.find((k) => k.id === teacherDialogKomaId)
  const detailDialogKoma = komas.find((k) => k.id === detailDialogKomaId)

  // === 時数変更 ===
  const handleHoursChange = useCallback(
    async (subjectId: string, newHours: number) => {
      const row = rows.find((r) => r.subjectId === subjectId)
      if (!row) return

      if (newHours <= 0) {
        // 全削除
        for (const komaId of row.komaIds) {
          await deleteKoma(komaId)
        }
        toast.success("教科を削除しました")
        return
      }

      if (row.komaIds.length === 0) {
        // 新規作成: クラス数分の駒を生成
        await createKomasForSubject(subjectId, newHours)
        return
      }

      // 既存駒のcountを更新
      for (const komaId of row.komaIds) {
        await updateKoma(komaId, { count: newHours })
      }
    },
    [rows, deleteKoma, updateKoma]
  )

  // 教科追加時の駒生成
  const createKomasForSubject = useCallback(
    async (subjectId: string, count: number) => {
      if (gradeClasses.length === 0) return

      // クラス数分の駒を一括作成
      const komasData = gradeClasses.map(() => ({
        subjectId,
        gradeId,
        count,
      }))
      const created = await batchCreateKomas(komasData)

      // 各駒にクラスを割当
      for (let i = 0; i < created.length; i++) {
        if (gradeClasses[i]) {
          await setKomaClasses(created[i].id, [gradeClasses[i].id])
        }
      }
    },
    [gradeId, gradeClasses, batchCreateKomas, setKomaClasses]
  )

  // === 教科追加 ===
  const handleAddSubject = useCallback(
    async (subjectId: string) => {
      await createKomasForSubject(subjectId, 1)
      setAddSubjectDialogOpen(false)
      toast.success("教科を追加しました")
    },
    [createKomasForSubject]
  )

  // === 先生設定保存 ===
  const handleSaveTeachers = useCallback(
    async (teacherAssignments: { teacherId: string; role: string }[]) => {
      if (!teacherDialogKomaId) return
      await setKomaTeachers(teacherDialogKomaId, teacherAssignments)
    },
    [teacherDialogKomaId, setKomaTeachers]
  )

  // === 詳細設定保存 ===
  const handleUpdateKoma = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      await updateKoma(id, data)
    },
    [updateKoma]
  )

  const handleSetRooms = useCallback(
    async (komaId: string, roomIds: string[]) => {
      await setKomaRooms(komaId, roomIds)
    },
    [setKomaRooms]
  )

  // === 合同授業設定 ===
  const handleCombineClasses = useCallback(
    async (komaId: string, targetClassIds: string[]) => {
      // 対象の駒を特定
      const sourceKoma = komas.find((k) => k.id === komaId)
      if (!sourceKoma) return

      // 同じ教科の他の駒から、指定クラスに割当済みの駒を見つける
      const sameSubjectKomas = komas.filter(
        (k) => k.subjectId === sourceKoma.subjectId && k.id !== komaId
      )
      const komaIdsToDelete: string[] = []

      for (const targetClassId of targetClassIds) {
        const targetKoma = sameSubjectKomas.find(
          (k) =>
            k.komaClasses?.some((kc) => kc.classId === targetClassId) ?? false
        )
        if (targetKoma && !komaIdsToDelete.includes(targetKoma.id)) {
          komaIdsToDelete.push(targetKoma.id)
        }
      }

      // 元の駒に全クラスを割当
      const sourceClassIds =
        sourceKoma.komaClasses?.map((kc) => kc.classId) ?? []
      const allClassIds = [...new Set([...sourceClassIds, ...targetClassIds])]
      await setKomaClasses(komaId, allClassIds)

      // 統合された駒を削除
      for (const id of komaIdsToDelete) {
        await deleteKoma(id)
      }

      setCombineDialogKomaId(null)
      toast.success("合同授業を設定しました")
    },
    [komas, setKomaClasses, deleteKoma]
  )

  // === 合同授業解除 ===
  const handleSplitCombine = useCallback(
    async (komaId: string) => {
      const koma = komas.find((k) => k.id === komaId)
      if (!koma) return

      const classIds = koma.komaClasses?.map((kc) => kc.classId) ?? []
      if (classIds.length <= 1) return

      const teacherData =
        koma.komaTeachers?.map((kt) => ({
          teacherId: kt.teacherId,
          role: kt.role,
        })) ?? []

      // 最初のクラスだけ元の駒に残す
      await setKomaClasses(komaId, [classIds[0]])

      // 残りのクラスに新しい駒を作成
      for (let i = 1; i < classIds.length; i++) {
        const created = await createKoma({
          subjectId: koma.subjectId,
          gradeId: koma.gradeId,
          count: koma.count,
          type: koma.type,
          priority: koma.priority,
          label: koma.label,
        })
        await setKomaClasses(created.id, [classIds[i]])
        if (teacherData.length > 0) {
          await setKomaTeachers(created.id, teacherData)
        }
      }

      toast.success("合同授業を解除しました")
    },
    [komas, setKomaClasses, createKoma, setKomaTeachers]
  )

  // 先生ダイアログ用の現在値
  const currentMainId =
    teacherDialogKoma?.komaTeachers?.find((kt) => kt.role === "main")
      ?.teacherId ?? null
  const currentSubIds =
    teacherDialogKoma?.komaTeachers
      ?.filter((kt) => kt.role === "sub")
      .map((kt) => kt.teacherId) ?? []

  if (gradeClasses.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">
          この学年にクラスがありません。初期設定で学校を設定してください。
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="border px-3 py-2 text-left font-medium">教科</th>
              <th className="w-16 border px-2 py-2 text-center font-medium">
                時数
              </th>
              {gradeClasses.map((cls) => (
                <th
                  key={cls.id}
                  className="min-w-[100px] border px-3 py-2 text-center font-medium"
                >
                  {cls.name}
                </th>
              ))}
              <th className="w-10 border px-1 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <SubjectRowView
                key={row.subjectId}
                row={row}
                gradeClasses={gradeClasses}
                onHoursChange={handleHoursChange}
                onClickTeacher={setTeacherDialogKomaId}
                onCombine={setCombineDialogKomaId}
                onSplitCombine={handleSplitCombine}
                onDetail={setDetailDialogKomaId}
                onDeleteSubject={async () => {
                  for (const komaId of row.komaIds) {
                    await deleteKoma(komaId)
                  }
                  toast.success("教科を削除しました")
                }}
              />
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={gradeClasses.length + 3}
                  className="text-muted-foreground border py-8 text-center"
                >
                  授業がありません。「+
                  教科を追加」またはプリセットから生成してください。
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td
                colSpan={gradeClasses.length + 3}
                className="border px-3 py-1"
              >
                {unusedSubjects.length > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground h-7 text-xs"
                    onClick={() => setAddSubjectDialogOpen(true)}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    教科を追加
                  </Button>
                ) : (
                  <span className="text-muted-foreground px-2 text-xs">
                    全教科が設定済みです
                  </span>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 先生選択ダイアログ */}
      <TeacherSelectDialog
        open={!!teacherDialogKomaId}
        onOpenChange={(open) => {
          if (!open) setTeacherDialogKomaId(null)
        }}
        teachers={teachers}
        currentMainId={currentMainId}
        currentSubIds={currentSubIds}
        onSave={handleSaveTeachers}
      />

      {/* 詳細設定ダイアログ */}
      <KomaDetailDialog
        open={!!detailDialogKomaId}
        onOpenChange={(open) => {
          if (!open) setDetailDialogKomaId(null)
        }}
        koma={detailDialogKoma ?? null}
        rooms={rooms}
        onUpdateKoma={handleUpdateKoma}
        onSetRooms={handleSetRooms}
      />

      {/* 合同授業設定ダイアログ */}
      <CombineDialog
        open={!!combineDialogKomaId}
        onOpenChange={(open) => {
          if (!open) setCombineDialogKomaId(null)
        }}
        komaId={combineDialogKomaId}
        komas={komas}
        gradeClasses={gradeClasses}
        onCombine={handleCombineClasses}
      />

      {/* 教科追加ダイアログ */}
      <Dialog
        open={addSubjectDialogOpen}
        onOpenChange={setAddSubjectDialogOpen}
      >
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>教科を追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {unusedSubjects.map((s) => (
              <Button
                key={s.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleAddSubject(s.id)}
              >
                <div
                  className="mr-2 h-3 w-3 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// === 教科行コンポーネント ===

function SubjectRowView({
  row,
  gradeClasses,
  onHoursChange,
  onClickTeacher,
  onCombine,
  onSplitCombine,
  onDetail,
  onDeleteSubject,
}: {
  row: ReturnType<typeof buildSubjectRows>[number]
  gradeClasses: ClassInfo[]
  onHoursChange: (subjectId: string, hours: number) => Promise<void>
  onClickTeacher: (komaId: string) => void
  onCombine: (komaId: string) => void
  onSplitCombine: (komaId: string) => Promise<void>
  onDetail: (komaId: string) => void
  onDeleteSubject: () => Promise<void>
}) {
  return (
    <tr>
      {/* 教科名 */}
      <td className="border px-3 py-1">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: row.subjectColor }}
          />
          <span className="font-medium">{row.subjectName}</span>
        </div>
      </td>

      {/* 時数 */}
      <td className="border px-1 py-1 text-center">
        <Input
          type="number"
          min={0}
          max={10}
          defaultValue={row.hours}
          key={`${row.subjectId}-${row.hours}`}
          className="h-7 w-14 text-center"
          onBlur={(e) => {
            const val = parseInt(e.target.value) || 0
            if (val !== row.hours) {
              onHoursChange(row.subjectId, val)
            }
          }}
        />
      </td>

      {/* クラス列 */}
      {row.cells.map((cell, colIdx) => {
        if (cell === "spanned") return null
        if (cell === null) {
          return (
            <td key={colIdx} className="border px-2 py-1">
              <span className="text-muted-foreground text-xs">-</span>
            </td>
          )
        }

        const isCombined = cell.classIds.length > 1
        const combinedClassNames = isCombined
          ? cell.classIds
              .map((cid) => gradeClasses.find((c) => c.id === cid)?.name)
              .filter(Boolean)
              .join("+")
          : undefined

        return (
          <TeacherCell
            key={cell.komaId}
            cell={cell}
            colSpan={cell.colSpan}
            subjectColor={row.subjectColor}
            isCombined={isCombined}
            combinedClassNames={combinedClassNames}
            onClickTeacher={onClickTeacher}
            onCombine={onCombine}
            onSplitCombine={onSplitCombine}
            onDetail={onDetail}
          />
        )
      })}

      {/* 削除 */}
      <td className="border px-1 py-1 text-center">
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive h-6 w-6 p-0"
          onClick={onDeleteSubject}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </td>
    </tr>
  )
}

// === 合同授業設定ダイアログ ===

function CombineDialog({
  open,
  onOpenChange,
  komaId,
  komas,
  gradeClasses,
  onCombine,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  komaId: string | null
  komas: Koma[]
  gradeClasses: ClassInfo[]
  onCombine: (komaId: string, classIds: string[]) => Promise<void>
}) {
  const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(
    new Set()
  )
  const [saving, setSaving] = useState(false)

  const koma = komas.find((k) => k.id === komaId)
  const currentClassIds = koma?.komaClasses?.map((kc) => kc.classId) ?? []

  // この駒が属していないクラスを選択肢として表示
  const availableClasses = gradeClasses.filter(
    (c) => !currentClassIds.includes(c.id)
  )

  const handleToggle = useCallback((classId: string, checked: boolean) => {
    setSelectedClassIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(classId)
      } else {
        next.delete(classId)
      }
      return next
    })
  }, [])

  const handleSave = useCallback(async () => {
    if (!komaId || selectedClassIds.size === 0) return
    setSaving(true)
    try {
      await onCombine(komaId, Array.from(selectedClassIds))
      setSelectedClassIds(new Set())
    } finally {
      setSaving(false)
    }
  }, [komaId, selectedClassIds, onCombine])

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setSelectedClassIds(new Set())
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>合同授業の設定</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          合同にするクラスを選択してください。
        </p>
        <div className="space-y-2">
          {availableClasses.map((cls) => (
            <div key={cls.id} className="flex items-center gap-2">
              <Checkbox
                id={`combine-${cls.id}`}
                checked={selectedClassIds.has(cls.id)}
                onCheckedChange={(checked) =>
                  handleToggle(cls.id, checked === true)
                }
              />
              <Label htmlFor={`combine-${cls.id}`} className="cursor-pointer">
                {cls.name}
              </Label>
            </div>
          ))}
          {availableClasses.length === 0 && (
            <p className="text-muted-foreground text-sm">
              合同にできるクラスがありません。
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            キャンセル
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={selectedClassIds.size === 0 || saving}
          >
            設定
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
