"use client"

import { useEffect } from "react"

import { CapacityCheckTable } from "@/components/scheduler/CapacityCheckTable"
import { PeriodSummaryGrid } from "@/components/scheduler/PeriodSummaryGrid"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useKomaCheck } from "@/hooks/useKomaCheck"
import { useSchool } from "@/hooks/useSchool"

export default function CheckPage() {
  const { school } = useSchool()
  const {
    teacherCapacity,
    periodSummary,
    loading,
    error,
    fetchTeacherCapacity,
    fetchPeriodSummary,
  } = useKomaCheck()

  useEffect(() => {
    fetchTeacherCapacity()
  }, [fetchTeacherCapacity])

  useEffect(() => {
    if (school) {
      fetchPeriodSummary(school.daysPerWeek, school.maxPeriodsPerDay)
    }
  }, [school, fetchPeriodSummary])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  const overCapacity = teacherCapacity.filter((t) => {
    const availableSlots =
      (school?.daysPerWeek ?? 5) * (school?.maxPeriodsPerDay ?? 6) -
      t.unavailableCount -
      t.dutyCount
    return availableSlots < t.totalKomaCount
  })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">駒チェック</h1>
        <p className="text-muted-foreground mt-1">
          先生の容量と時限ごとの配置可能状況を確認します
        </p>
      </div>

      {overCapacity.length > 0 && (
        <Card className="border-destructive mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-destructive text-base">
              容量超過の先生: {overCapacity.length}名
            </CardTitle>
            <CardDescription>
              空き枠よりも持ち駒数が多い先生がいます。駒設定を見直してください。
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Tabs defaultValue="capacity">
        <TabsList>
          <TabsTrigger value="capacity">先生容量チェック</TabsTrigger>
          <TabsTrigger value="summary">時限サマリ</TabsTrigger>
        </TabsList>

        <TabsContent value="capacity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>先生容量一覧</CardTitle>
              <CardDescription>
                各先生の持ち駒数と空き枠の過不足を確認します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CapacityCheckTable
                data={teacherCapacity}
                daysPerWeek={school?.daysPerWeek ?? 5}
                maxPeriodsPerDay={school?.maxPeriodsPerDay ?? 6}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>曜日×時限サマリ</CardTitle>
              <CardDescription>
                各時限の利用可能教員数と必要駒数を比較します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PeriodSummaryGrid
                data={periodSummary}
                daysPerWeek={school?.daysPerWeek ?? 5}
                maxPeriodsPerDay={school?.maxPeriodsPerDay ?? 6}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
