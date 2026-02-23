"use client"

import { useState, useCallback, useRef } from "react"
import { Upload, FileText, Import } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ElectiveStudent } from "@/types/exam.types"

interface ElectiveCsvImportProps {
  onImport: (students: ElectiveStudent[]) => void
}

export function ElectiveCsvImport({ onImport }: ElectiveCsvImportProps) {
  const [csvText, setCsvText] = useState("")
  const [preview, setPreview] = useState<ElectiveStudent[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseCsv = useCallback((text: string) => {
    try {
      setParseError(null)
      const lines = text.trim().split("\n")
      if (lines.length < 2) {
        setPreview([])
        return
      }

      const parsed: ElectiveStudent[] = []
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue
        const cols = line.split(",").map((c) => c.trim())
        if (cols.length < 3) continue

        const id = cols[0]
        const name = cols[1]
        const choices = cols.slice(2).filter((c) => c.length > 0)

        parsed.push({ id, name, choices })
      }

      setPreview(parsed)
    } catch (err) {
      setParseError(
        err instanceof Error ? err.message : "CSVの解析に失敗しました"
      )
      setPreview([])
    }
  }, [])

  const handleTextChange = useCallback(
    (text: string) => {
      setCsvText(text)
      parseCsv(text)
    },
    [parseCsv]
  )

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (ev) => {
        const text = ev.target?.result as string
        setCsvText(text)
        parseCsv(text)
      }
      reader.readAsText(file)

      // Reset input so the same file can be re-selected
      e.target.value = ""
    },
    [parseCsv]
  )

  const handleImport = useCallback(() => {
    if (preview.length > 0) {
      onImport(preview)
    }
  }, [preview, onImport])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          CSV読み込み
        </CardTitle>
        <CardDescription>
          CSV形式: ID, 氏名, 選択1, 選択2, ...（1行目はヘッダー）
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="csv-text">CSVデータ</Label>
          <textarea
            id="csv-text"
            className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[120px] w-full rounded-md border bg-transparent px-3 py-2 text-sm font-mono shadow-sm focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={"ID,氏名,選択1,選択2,選択3\n001,山田太郎,音楽,美術,書道"}
            value={csvText}
            onChange={(e) => handleTextChange(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            ファイルを選択
          </Button>
          <Button
            size="sm"
            disabled={preview.length === 0}
            onClick={handleImport}
          >
            <Import className="mr-2 h-4 w-4" />
            取り込み ({preview.length}件)
          </Button>
        </div>

        {parseError && (
          <p className="text-sm text-destructive">{parseError}</p>
        )}

        {preview.length > 0 && (
          <div className="space-y-2">
            <Label>プレビュー（先頭10件）</Label>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>氏名</TableHead>
                  <TableHead>選択科目</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.slice(0, 10).map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-mono text-sm">
                      {student.id}
                    </TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {student.choices.join(", ")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {preview.length > 10 && (
              <p className="text-xs text-muted-foreground">
                ...他 {preview.length - 10} 件
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
