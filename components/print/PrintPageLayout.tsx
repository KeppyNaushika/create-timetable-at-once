"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { PrintSettingsPanel, getDefaultPrintSettings } from "./PrintSettingsPanel"
import { PrintPreview } from "./PrintPreview"
import { useTimetableData } from "@/hooks/useTimetableData"
import type { TimetableData } from "@/hooks/useTimetableData"
import type { PrintSettings, ReportType } from "@/types/review.types"
import { REPORT_TYPES } from "@/lib/constants"
import { generatePdfBlob } from "@/lib/pdf/generatePdf"
import { Loader2, FileDown, FileSpreadsheet, Printer } from "lucide-react"

interface PrintPageLayoutProps {
  reportType: ReportType
  children: (props: {
    data: TimetableData
    settings: PrintSettings
  }) => React.ReactNode
}

export function PrintPageLayout({ reportType, children }: PrintPageLayoutProps) {
  const { data, loading, error } = useTimetableData()
  const [settings, setSettings] = useState<PrintSettings>(getDefaultPrintSettings)
  const [exporting, setExporting] = useState(false)

  const handlePdfExport = useCallback(async () => {
    if (!data.school) return
    setExporting(true)
    try {
      const blob = await generatePdfBlob(reportType, data, settings)
      const arrayBuffer = await blob.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      const result = await window.electronAPI.exportSavePdf(
        Array.from(uint8Array),
        `${REPORT_TYPES[reportType]}.pdf`
      )
      if (result.error) {
        console.error("PDF保存エラー:", result.error)
      }
    } catch (err) {
      console.error("PDF生成エラー:", err)
    } finally {
      setExporting(false)
    }
  }, [data, settings, reportType])

  const handleExcelExport = useCallback(async () => {
    if (!data.school) return
    setExporting(true)
    try {
      const result = await window.electronAPI.exportExcel(
        reportType,
        {
          school: data.school,
          teachers: data.teachers,
          classes: data.classes,
          subjects: data.subjects,
          rooms: data.rooms,
          duties: data.duties,
          komas: data.komas,
          grades: data.grades,
          slots: data.slots,
        },
        `${REPORT_TYPES[reportType]}.xlsx`
      )
      if (result.error) {
        console.error("Excel保存エラー:", result.error)
      }
    } catch (err) {
      console.error("Excel生成エラー:", err)
    } finally {
      setExporting(false)
    }
  }, [data, reportType])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-destructive">エラー: {error}</div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold">{REPORT_TYPES[reportType]}</h1>
          <p className="text-sm text-muted-foreground">
            印刷・PDF・Excel出力
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePdfExport}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExcelExport}
            disabled={exporting}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            印刷
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[250px_1fr] no-print">
        <PrintSettingsPanel settings={settings} onChange={setSettings} />
        <div className="text-sm text-muted-foreground">
          下のプレビューエリアに表示されている内容が出力されます
        </div>
      </div>

      <div className="border rounded-lg p-4 print-area">
        {children({ data, settings })}
      </div>
    </div>
  )
}
