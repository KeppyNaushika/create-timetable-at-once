"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { LessonTable } from "@/components/lesson/LessonTable"
import { PresetDialog } from "@/components/lesson/PresetDialog"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { useClasses } from "@/hooks/useClasses"
import { useKomas } from "@/hooks/useKomas"
import { useRooms } from "@/hooks/useRooms"
import { useSubjects } from "@/hooks/useSubjects"
import { useTeachers } from "@/hooks/useTeachers"

export default function LessonPage() {
  const { grades, classes } = useClasses()
  const { subjects } = useSubjects()
  const { teachers } = useTeachers()
  const { rooms } = useRooms()

  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null)
  const [presetOpen, setPresetOpen] = useState(false)

  const {
    komas,
    loading,
    createKoma,
    updateKoma,
    deleteKoma,
    setKomaTeachers,
    setKomaClasses,
    setKomaRooms,
    batchCreateKomas,
    deleteKomasByGrade,
  } = useKomas(selectedGradeId ?? undefined)

  useEffect(() => {
    if (grades.length > 0 && !selectedGradeId) {
      setSelectedGradeId(grades[0].id)
    }
  }, [grades, selectedGradeId])

  const gradeClasses = useMemo(
    () =>
      classes
        .filter((c) => c.gradeId === selectedGradeId)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [classes, selectedGradeId]
  )

  // プリセットから一括生成（クラス単位で駒を作成）
  const handlePresetGenerate = useCallback(
    async (
      gradeId: string,
      items: { subjectId: string; count: number; type: string }[]
    ) => {
      const targetClasses = classes
        .filter((c) => c.gradeId === gradeId)
        .sort((a, b) => a.sortOrder - b.sortOrder)

      if (targetClasses.length === 0) {
        toast.error("対象学年にクラスがありません")
        return
      }

      // 各教科 × クラス数 分の駒を生成
      const komasData: Record<string, unknown>[] = []
      const classAssignments: { komaIndex: number; classId: string }[] = []

      for (const item of items) {
        for (let i = 0; i < targetClasses.length; i++) {
          classAssignments.push({
            komaIndex: komasData.length,
            classId: targetClasses[i].id,
          })
          komasData.push({
            subjectId: item.subjectId,
            gradeId,
            count: item.count,
            type: item.type,
          })
        }
      }

      const created = await batchCreateKomas(komasData)

      // 各駒にクラスを割当
      for (const assignment of classAssignments) {
        const koma = created[assignment.komaIndex]
        if (koma) {
          await setKomaClasses(koma.id, [assignment.classId])
        }
      }

      toast.success(`${items.length}教科 × ${targetClasses.length}クラスの駒を生成しました`)
    },
    [classes, batchCreateKomas, setKomaClasses]
  )

  const handleDeleteAndGenerate = useCallback(
    async (
      gradeId: string,
      items: { subjectId: string; count: number; type: string }[]
    ) => {
      await deleteKomasByGrade(gradeId)
      await handlePresetGenerate(gradeId, items)
    },
    [deleteKomasByGrade, handlePresetGenerate]
  )

  if (loading && grades.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="授業設定"
        description="各学年の授業時数と担当先生を設定します"
      >
        <Button variant="outline" onClick={() => setPresetOpen(true)}>
          プリセット読込
        </Button>
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

      {/* メインテーブル */}
      <div className="flex-1 overflow-auto p-6">
        {selectedGradeId && (
          <LessonTable
            gradeId={selectedGradeId}
            komas={komas}
            subjects={subjects}
            gradeClasses={gradeClasses}
            teachers={teachers}
            rooms={rooms}
            createKoma={createKoma}
            updateKoma={updateKoma}
            deleteKoma={deleteKoma}
            setKomaTeachers={setKomaTeachers}
            setKomaClasses={setKomaClasses}
            setKomaRooms={setKomaRooms}
            batchCreateKomas={batchCreateKomas}
          />
        )}
      </div>

      {/* プリセットダイアログ */}
      <PresetDialog
        open={presetOpen}
        onOpenChange={setPresetOpen}
        grades={grades}
        subjects={subjects}
        onGenerate={handlePresetGenerate}
        onDeleteAndGenerate={handleDeleteAndGenerate}
      />
    </div>
  )
}
