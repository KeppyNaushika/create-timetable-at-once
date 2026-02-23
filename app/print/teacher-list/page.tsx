"use client"

import { PrintPageLayout } from "@/components/print/PrintPageLayout"

export default function TeacherListPrintPage() {
  return (
    <PrintPageLayout reportType="teacher-list">
      {({ data, settings }) => {
        const subjectMap = new Map(data.subjects.map((s) => [s.id, s]))

        return (
          <div>
            <h2 className="mb-4 text-center text-xl font-bold">先生一覧表</h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {["氏名", "カナ", "主担当教科", "1日最大", "連続最大", "週最大", "備考"].map(
                    (h) => (
                      <th key={h} className="border bg-muted px-3 py-2 text-left">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {data.teachers.map((teacher) => {
                  const mainSubject = teacher.mainSubjectId
                    ? subjectMap.get(teacher.mainSubjectId)
                    : null
                  return (
                    <tr key={teacher.id}>
                      <td className="border px-3 py-2">{teacher.name}</td>
                      <td className="border px-3 py-2">{teacher.nameKana}</td>
                      <td className="border px-3 py-2">{mainSubject?.name ?? ""}</td>
                      <td className="border px-3 py-2 text-center">{teacher.maxPerDay}</td>
                      <td className="border px-3 py-2 text-center">{teacher.maxConsecutive}</td>
                      <td className="border px-3 py-2 text-center">{teacher.maxPeriodsPerWeek}</td>
                      <td className="border px-3 py-2">{teacher.notes}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {settings.footer && (
              <div className="mt-2 text-right text-xs text-muted-foreground">{settings.footer}</div>
            )}
          </div>
        )
      }}
    </PrintPageLayout>
  )
}
