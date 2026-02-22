"use client"

import { useCallback } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useClasses } from "@/hooks/useClasses"

export default function ClassesPage() {
  const { classesByGrade, loading, updateClass } = useClasses()

  const handleNameChange = useCallback(
    async (classId: string, newName: string) => {
      try {
        await updateClass(classId, { name: newName })
        toast.success("クラス名を更新しました")
      } catch {
        toast.error("更新に失敗しました")
      }
    },
    [updateClass]
  )

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
        title="クラス設定"
        description="学年・クラスの表示名を編集します。学級数は「学校基本設定」で変更できます。"
      />

      <div className="space-y-6 p-6">
        {classesByGrade.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground py-8 text-center">
              学年・クラスがまだ作成されていません。
              「学校基本設定」で学級構成を保存してください。
            </CardContent>
          </Card>
        ) : (
          classesByGrade.map(({ grade, classes }) => (
            <Card key={grade.id}>
              <CardHeader>
                <CardTitle>{grade.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>クラス名</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.map((cls, index) => (
                      <TableRow key={cls.id}>
                        <TableCell className="text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <Input
                            defaultValue={cls.name}
                            onBlur={(e) => {
                              if (e.target.value !== cls.name) {
                                handleNameChange(cls.id, e.target.value)
                              }
                            }}
                            className="h-8 w-40"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {classes.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={2}
                          className="text-muted-foreground py-4 text-center"
                        >
                          クラスがありません
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
