"use client"

import { PrintPageLayout } from "@/components/print/PrintPageLayout"

export default function KomaListPrintPage() {
  return (
    <PrintPageLayout reportType="koma-list">
      {({ data, settings }) => {
        const subjectMap = new Map(data.subjects.map((s) => [s.id, s]))
        const gradeMap = new Map(data.grades.map((g) => [g.id, g]))
        const teacherMap = new Map(data.teachers.map((t) => [t.id, t]))

        return (
          <div>
            <h2 className="mb-4 text-center text-xl font-bold">駒一覧</h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {[
                    "教科",
                    "学年",
                    "タイプ",
                    "コマ数",
                    "ラベル",
                    "担当先生",
                    "優先度",
                  ].map((h) => (
                    <th key={h} className="bg-muted border px-3 py-2 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.komas.map((koma) => {
                  const subject = subjectMap.get(koma.subjectId)
                  const grade = gradeMap.get(koma.gradeId)
                  const teachers = koma.komaTeachers
                    ?.map((kt) => teacherMap.get(kt.teacherId)?.name ?? "")
                    .filter(Boolean)
                    .join(", ")
                  return (
                    <tr key={koma.id}>
                      <td className="border px-3 py-2">
                        {subject?.name ?? ""}
                      </td>
                      <td className="border px-3 py-2">{grade?.name ?? ""}</td>
                      <td className="border px-3 py-2">
                        {koma.type === "consecutive" ? "連続" : "普通"}
                      </td>
                      <td className="border px-3 py-2 text-center">
                        {koma.count}
                      </td>
                      <td className="border px-3 py-2">{koma.label}</td>
                      <td className="border px-3 py-2">{teachers ?? ""}</td>
                      <td className="border px-3 py-2 text-center">
                        {koma.priority}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {settings.footer && (
              <div className="text-muted-foreground mt-2 text-right text-xs">
                {settings.footer}
              </div>
            )}
          </div>
        )
      }}
    </PrintPageLayout>
  )
}
