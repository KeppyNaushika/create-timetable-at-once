"use client"

import { useCallback, useEffect, useState } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSchool } from "@/hooks/useSchool"
import type { ClassCounts } from "@/types/common.types"

export default function SchoolSetupPage() {
  const { school, loading, createSchool, updateSchool, fetchSchool } =
    useSchool()

  const [name, setName] = useState("")
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear())
  const [classCounts, setClassCounts] = useState<ClassCounts>({
    "1": 4,
    "2": 4,
    "3": 4,
  })
  const [namingConvention, setNamingConvention] = useState("number")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (school) {
      setName(school.name)
      setAcademicYear(school.academicYear)
      setNamingConvention(school.namingConvention)
      try {
        const counts = JSON.parse(school.classCountsJson)
        if (Object.keys(counts).length > 0) {
          setClassCounts(counts)
        }
      } catch {
        // use defaults
      }
    }
  }, [school])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const data = {
        name,
        academicYear,
        classCountsJson: JSON.stringify(classCounts),
        namingConvention,
      }

      if (school) {
        await updateSchool(school.id, data)
      } else {
        await createSchool(data)
      }

      // 学年とクラスを自動生成
      const grades = await window.electronAPI.gradeGetAll()

      for (const gradeNumStr of Object.keys(classCounts)) {
        const gradeNum = parseInt(gradeNumStr)
        const count = classCounts[gradeNumStr]
        const existingGrade = grades.find(
          (g: { gradeNum: number }) => g.gradeNum === gradeNum
        )

        let gradeId: string

        if (!existingGrade) {
          const newGrade = await window.electronAPI.gradeCreate({
            gradeNum,
            name: `${gradeNum}年`,
          })
          gradeId = newGrade.id
        } else {
          gradeId = existingGrade.id
        }

        // 既存クラスの取得
        const existingClasses =
          await window.electronAPI.classGetByGradeId(gradeId)
        const existingCount = existingClasses.length

        // 不足分のクラスを作成
        if (existingCount < count) {
          const newClasses = []
          for (let i = existingCount; i < count; i++) {
            const className =
              namingConvention === "number"
                ? `${i + 1}組`
                : `${String.fromCharCode(65 + i)}組`
            newClasses.push({
              gradeId,
              name: className,
              sortOrder: i,
            })
          }
          if (newClasses.length > 0) {
            await window.electronAPI.classBatchCreate(newClasses)
          }
        }
      }

      await fetchSchool()
      toast.success("学校基本設定を保存しました")
    } catch {
      toast.error("保存に失敗しました")
    } finally {
      setSaving(false)
    }
  }, [
    school,
    name,
    academicYear,
    classCounts,
    namingConvention,
    updateSchool,
    createSchool,
    fetchSchool,
  ])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="学校基本設定"
        description="学校名、年度、学年・学級構成を設定します"
      >
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "保存中..." : "保存"}
        </Button>
      </PageHeader>

      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
            <CardDescription>学校の基本情報を入力してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schoolName">学校名</Label>
                <Input
                  id="schoolName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: ○○市立△△中学校"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="academicYear">年度</Label>
                <Input
                  id="academicYear"
                  type="number"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(parseInt(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>学級構成</CardTitle>
            <CardDescription>
              各学年の学級数と命名規則を設定します
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>クラス命名規則</Label>
              <Select
                value={namingConvention}
                onValueChange={setNamingConvention}
              >
                <SelectTrigger className="w-60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="number">数字 (1組, 2組, ...)</SelectItem>
                  <SelectItem value="alphabet">
                    アルファベット (A組, B組, ...)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((gradeNum) => (
                <div key={gradeNum} className="space-y-2">
                  <Label>{gradeNum}年 学級数</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={classCounts[String(gradeNum)] ?? 4}
                    onChange={(e) =>
                      setClassCounts((prev) => ({
                        ...prev,
                        [String(gradeNum)]: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
