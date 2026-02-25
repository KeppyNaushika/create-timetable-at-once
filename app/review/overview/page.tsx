"use client"

import { Loader2 } from "lucide-react"
import { useState } from "react"

import { OverviewMatrix } from "@/components/review/OverviewMatrix"
import { SubjectHighlightPicker } from "@/components/review/SubjectHighlightPicker"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTimetableData } from "@/hooks/useTimetableData"
import type { SubjectHighlight } from "@/types/review.types"

export default function OverviewPage() {
  const { data, loading, error } = useTimetableData()
  const [highlights, setHighlights] = useState<SubjectHighlight[]>([])
  const [filterSubjectId, setFilterSubjectId] = useState<string | null>(null)

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
        <h1 className="text-2xl font-bold">全体表</h1>
        <p className="text-muted-foreground text-sm">
          先生別・クラス別の時間割を一覧表示します
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <SubjectHighlightPicker
          subjects={data.subjects}
          highlights={highlights}
          onChange={setHighlights}
        />
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">フィルタ:</span>
          <select
            className="border-input bg-background h-8 rounded border px-2 text-sm"
            value={filterSubjectId ?? ""}
            onChange={(e) => setFilterSubjectId(e.target.value || null)}
          >
            <option value="">すべて表示</option>
            {data.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Tabs defaultValue="teacher">
        <TabsList>
          <TabsTrigger value="teacher">先生別</TabsTrigger>
          <TabsTrigger value="class">クラス別</TabsTrigger>
        </TabsList>

        <TabsContent value="teacher">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">先生別全体表</CardTitle>
              <CardDescription>
                全先生の時間割一覧（{data.teachers.length}名）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OverviewMatrix
                mode="teacher"
                entities={data.teachers}
                slots={data.slots}
                komas={data.komas}
                subjects={data.subjects}
                daysPerWeek={daysPerWeek}
                maxPeriodsPerDay={maxPeriodsPerDay}
                highlights={highlights}
                filterSubjectId={filterSubjectId}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="class">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">クラス別全体表</CardTitle>
              <CardDescription>
                全クラスの時間割一覧（{data.classes.length}クラス）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OverviewMatrix
                mode="class"
                entities={data.classes}
                slots={data.slots}
                komas={data.komas}
                subjects={data.subjects}
                daysPerWeek={daysPerWeek}
                maxPeriodsPerDay={maxPeriodsPerDay}
                highlights={highlights}
                filterSubjectId={filterSubjectId}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
