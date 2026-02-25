"use client"

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { useMemo, useState } from "react"

import { HourCountSummary } from "@/components/review/HourCountSummary"
import { IndividualTimetableCard } from "@/components/review/IndividualTimetableCard"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTimetableData } from "@/hooks/useTimetableData"

export default function IndividualPage() {
  const { data, loading, error } = useTimetableData()
  const [mode, setMode] = useState<"teacher" | "class">("teacher")
  const [currentIndex, setCurrentIndex] = useState(0)

  const entities = useMemo(
    () => (mode === "teacher" ? data.teachers : data.classes),
    [mode, data.teachers, data.classes]
  )

  const currentEntity = entities[currentIndex]

  // エンティティに関連するスロットを取得
  const entitySlots = useMemo(() => {
    if (!currentEntity) return []
    return data.slots.filter((slot) => {
      const koma = data.komas.find((k) => k.id === slot.komaId)
      if (!koma) return false
      if (mode === "teacher") {
        return koma.komaTeachers?.some(
          (kt) => kt.teacherId === currentEntity.id
        )
      }
      return koma.komaClasses?.some((kc) => kc.classId === currentEntity.id)
    })
  }, [currentEntity, data.slots, data.komas, mode])

  const handlePrev = () => {
    setCurrentIndex((i) => Math.max(0, i - 1))
  }

  const handleNext = () => {
    setCurrentIndex((i) => Math.min(entities.length - 1, i + 1))
  }

  const handleModeChange = (newMode: string) => {
    setMode(newMode as "teacher" | "class")
    setCurrentIndex(0)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return <div className="text-destructive p-4">エラー: {error}</div>
  }

  if (!data.adoptedPattern) {
    return (
      <div className="text-muted-foreground p-8 text-center">
        採用済みの時間割パターンがありません。
        <br />
        先に時間割を作成し、パターンを採用してください。
      </div>
    )
  }

  const daysPerWeek = data.school?.daysPerWeek ?? 5
  const maxPeriodsPerDay = data.school?.maxPeriodsPerDay ?? 6

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">個別表</h1>
        <p className="text-muted-foreground text-sm">
          先生別・クラス別の個別時間割を表示します
        </p>
      </div>

      <Tabs value={mode} onValueChange={handleModeChange}>
        <TabsList>
          <TabsTrigger value="teacher">先生別</TabsTrigger>
          <TabsTrigger value="class">クラス別</TabsTrigger>
        </TabsList>

        <TabsContent value={mode}>
          {entities.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              {mode === "teacher" ? "先生" : "クラス"}が登録されていません
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <select
                    className="border-input bg-background h-9 rounded border px-3 text-sm"
                    value={currentIndex}
                    onChange={(e) => setCurrentIndex(Number(e.target.value))}
                  >
                    {entities.map((entity, i) => (
                      <option key={entity.id} value={i}>
                        {entity.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-muted-foreground text-sm">
                    ({currentIndex + 1} / {entities.length})
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    前へ
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={currentIndex === entities.length - 1}
                  >
                    次へ
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {currentEntity && (
                <div className="mt-4 space-y-4">
                  <IndividualTimetableCard
                    title={`${currentEntity.name} の時間割`}
                    slots={entitySlots}
                    komas={data.komas}
                    subjects={data.subjects}
                    daysPerWeek={daysPerWeek}
                    maxPeriodsPerDay={maxPeriodsPerDay}
                  />

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">時間数集計</CardTitle>
                      <CardDescription>教科別・曜日別のコマ数</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <HourCountSummary
                        slots={entitySlots}
                        komas={data.komas}
                        subjects={data.subjects}
                        daysPerWeek={daysPerWeek}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
