"use client"

import { PrintPageLayout } from "@/components/print/PrintPageLayout"

export default function RemainingKomaPrintPage() {
  return (
    <PrintPageLayout reportType="remaining-koma">
      {({ data, settings }) => {
        const subjectMap = new Map(data.subjects.map((s) => [s.id, s]))
        const gradeMap = new Map(data.grades.map((g) => [g.id, g]))
        const teacherMap = new Map(data.teachers.map((t) => [t.id, t]))

        const placedCount = new Map<string, number>()
        for (const slot of data.slots) {
          placedCount.set(slot.komaId, (placedCount.get(slot.komaId) ?? 0) + 1)
        }

        const remainingKomas = data.komas
          .map((koma) => ({
            koma,
            placed: placedCount.get(koma.id) ?? 0,
            remaining: koma.count - (placedCount.get(koma.id) ?? 0),
          }))
          .filter((r) => r.remaining > 0)

        return (
          <div>
            <h2 className="mb-4 text-center text-xl font-bold">残り駒一覧</h2>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              未配置: {remainingKomas.reduce((s, r) => s + r.remaining, 0)}コマ
            </p>
            {remainingKomas.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                全ての駒が配置済みです
              </div>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    {["教科", "学年", "ラベル", "必要数", "配置済", "残り", "担当先生"].map(
                      (h) => (
                        <th key={h} className="border bg-muted px-3 py-2 text-left">
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {remainingKomas.map(({ koma, placed, remaining }) => {
                    const subject = subjectMap.get(koma.subjectId)
                    const grade = gradeMap.get(koma.gradeId)
                    const teachers = koma.komaTeachers
                      ?.map((kt) => teacherMap.get(kt.teacherId)?.name ?? "")
                      .filter(Boolean)
                      .join(", ")
                    return (
                      <tr key={koma.id}>
                        <td className="border px-3 py-2">{subject?.name ?? ""}</td>
                        <td className="border px-3 py-2">{grade?.name ?? ""}</td>
                        <td className="border px-3 py-2">{koma.label}</td>
                        <td className="border px-3 py-2 text-center">{koma.count}</td>
                        <td className="border px-3 py-2 text-center">{placed}</td>
                        <td className="border px-3 py-2 text-center font-bold">{remaining}</td>
                        <td className="border px-3 py-2">{teachers ?? ""}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
            {settings.footer && (
              <div className="mt-2 text-right text-xs text-muted-foreground">{settings.footer}</div>
            )}
          </div>
        )
      }}
    </PrintPageLayout>
  )
}
