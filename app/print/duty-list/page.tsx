"use client"

import { PrintPageLayout } from "@/components/print/PrintPageLayout"
import { DAY_NAMES } from "@/lib/constants"

export default function DutyListPrintPage() {
  return (
    <PrintPageLayout reportType="duty-list">
      {({ data, settings }) => (
        <div>
          <h2 className="mb-4 text-center text-xl font-bold">校務一覧表</h2>
          {data.duties.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              校務が登録されていません
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {["校務名", "略称", "曜日", "時限", "担当者"].map((h) => (
                    <th key={h} className="bg-muted border px-3 py-2 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.duties.map((duty) => (
                  <tr key={duty.id}>
                    <td className="border px-3 py-2">{duty.name}</td>
                    <td className="border px-3 py-2">{duty.shortName}</td>
                    <td className="border px-3 py-2">
                      {DAY_NAMES[duty.dayOfWeek] ?? ""}
                    </td>
                    <td className="border px-3 py-2">{duty.period}</td>
                    <td className="border px-3 py-2">
                      {duty.teacherDuties
                        ?.map((td) => td.teacher?.name ?? "")
                        .filter(Boolean)
                        .join(", ") ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {settings.footer && (
            <div className="text-muted-foreground mt-2 text-right text-xs">
              {settings.footer}
            </div>
          )}
        </div>
      )}
    </PrintPageLayout>
  )
}
