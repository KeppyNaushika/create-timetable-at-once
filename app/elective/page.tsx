"use client"

import { Loader2, Sparkles, Trash2 } from "lucide-react"
import { useCallback } from "react"

import { ElectiveCsvImport } from "@/components/elective/ElectiveCsvImport"
import { ElectiveResultGrid } from "@/components/elective/ElectiveResultGrid"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useElective } from "@/hooks/useElective"
import type { ElectiveStudent } from "@/types/exam.types"

export default function ElectivePage() {
  const { students, result, loading, error, importCsv, optimize, clearAll } =
    useElective()

  const handleImport = useCallback(
    (imported: ElectiveStudent[]) => {
      // The hook's importCsv expects CSV text, but we already have parsed data
      // We can set students via the import flow
      // Re-format as CSV text and import
      const header =
        "ID,氏名," +
        imported[0]?.choices.map((_, i) => `選択${i + 1}`).join(",")
      const lines = imported.map((s) => [s.id, s.name, ...s.choices].join(","))
      const csvText = [header, ...lines].join("\n")
      importCsv(csvText)
    },
    [importCsv]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">選択科目最適化</h1>
          <p className="text-muted-foreground text-sm">
            生徒の選択希望をCSVで読み込み、グループ分けを最適化します
          </p>
        </div>
        <div className="flex items-center gap-2">
          {students.length > 0 && (
            <>
              <Badge variant="secondary">{students.length}名読込済</Badge>
              <Button
                onClick={optimize}
                disabled={loading || students.length === 0}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                最適化実行
              </Button>
              <Button variant="outline" size="sm" onClick={clearAll}>
                <Trash2 className="mr-2 h-4 w-4" />
                クリア
              </Button>
            </>
          )}
        </div>
      </div>

      {error && <div className="text-destructive p-4">エラー: {error}</div>}

      <ElectiveCsvImport onImport={handleImport} />

      {result && <ElectiveResultGrid result={result} students={students} />}

      {!result && students.length > 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <p className="text-muted-foreground">
              「最適化実行」ボタンを押してグループ分けを行ってください
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              生徒数: {students.length}名
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
