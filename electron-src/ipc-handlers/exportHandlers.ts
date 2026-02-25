import { dialog, ipcMain } from "electron"
import * as fs from "fs"

import { generateExcel } from "../lib/excel/generateExcel"

export function registerExportHandlers() {
  ipcMain.handle(
    "export:excel",
    async (
      _event,
      reportType: string,
      data: unknown,
      defaultFileName: string
    ) => {
      try {
        const buffer = await generateExcel(
          reportType,
          data as Parameters<typeof generateExcel>[1]
        )

        const result = await dialog.showSaveDialog({
          title: "Excelファイルを保存",
          defaultPath: defaultFileName || `${reportType}.xlsx`,
          filters: [{ name: "Excel", extensions: ["xlsx"] }],
        })

        if (result.canceled || !result.filePath) {
          return { success: false, canceled: true }
        }

        fs.writeFileSync(result.filePath, buffer)
        return { success: true, filePath: result.filePath }
      } catch (error) {
        console.error("Excel生成エラー:", error)
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Excel生成に失敗しました",
        }
      }
    }
  )

  ipcMain.handle(
    "export:savePdf",
    async (_event, pdfData: number[], defaultFileName: string) => {
      try {
        const result = await dialog.showSaveDialog({
          title: "PDFファイルを保存",
          defaultPath: defaultFileName || "timetable.pdf",
          filters: [{ name: "PDF", extensions: ["pdf"] }],
        })

        if (result.canceled || !result.filePath) {
          return { success: false, canceled: true }
        }

        const buffer = Buffer.from(pdfData)
        fs.writeFileSync(result.filePath, buffer)
        return { success: true, filePath: result.filePath }
      } catch (error) {
        console.error("PDF保存エラー:", error)
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "PDF保存に失敗しました",
        }
      }
    }
  )
}
