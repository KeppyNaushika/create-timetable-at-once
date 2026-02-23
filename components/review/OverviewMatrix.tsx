"use client"

import { DAY_NAMES } from "@/lib/constants"
import type {
  Koma,
  Subject,
  Teacher,
  ClassInfo,
  TimetableSlot,
} from "@/types/common.types"
import type { SubjectHighlight } from "@/types/review.types"

interface OverviewMatrixProps {
  mode: "teacher" | "class"
  entities: (Teacher | ClassInfo)[]
  slots: TimetableSlot[]
  komas: Koma[]
  subjects: Subject[]
  daysPerWeek: number
  maxPeriodsPerDay: number
  highlights: SubjectHighlight[]
  filterSubjectId: string | null
}

export function OverviewMatrix({
  mode,
  entities,
  slots,
  komas,
  subjects,
  daysPerWeek,
  maxPeriodsPerDay,
  highlights,
  filterSubjectId,
}: OverviewMatrixProps) {
  const komaMap = new Map(komas.map((k) => [k.id, k]))
  const subjectMap = new Map(subjects.map((s) => [s.id, s]))
  const highlightMap = new Map(highlights.map((h) => [h.subjectId, h.color]))

  // エンティティごとのスロットマップ構築
  const entitySlotMap = new Map<
    string,
    Map<string, TimetableSlot & { koma: Koma }>
  >()

  for (const slot of slots) {
    const koma = komaMap.get(slot.komaId)
    if (!koma) continue

    const entityIds: string[] =
      mode === "teacher"
        ? koma.komaTeachers?.map((kt) => kt.teacherId) ?? []
        : koma.komaClasses?.map((kc) => kc.classId) ?? []

    for (const eid of entityIds) {
      if (!entitySlotMap.has(eid)) entitySlotMap.set(eid, new Map())
      const key = `${slot.dayOfWeek}-${slot.period}`
      entitySlotMap.get(eid)!.set(key, { ...slot, koma })
    }
  }

  // フィルタリング: 特定教科を含むエンティティのみ
  let filteredEntities = entities
  if (filterSubjectId) {
    const entityIdsWithSubject = new Set<string>()
    for (const [eid, slotMap] of entitySlotMap) {
      for (const [, entry] of slotMap) {
        if (entry.koma.subjectId === filterSubjectId) {
          entityIdsWithSubject.add(eid)
        }
      }
    }
    filteredEntities = entities.filter((e) => entityIdsWithSubject.has(e.id))
  }

  const days = Array.from({ length: daysPerWeek }, (_, i) => i)
  const periods = Array.from({ length: maxPeriodsPerDay }, (_, i) => i + 1)

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 border bg-muted px-2 py-1 text-left min-w-[80px]">
              {mode === "teacher" ? "先生" : "クラス"}
            </th>
            {days.map((d) =>
              periods.map((p) => (
                <th
                  key={`${d}-${p}`}
                  className={`border bg-muted px-1 py-1 text-center min-w-[50px] ${
                    p === 1 ? "border-l-2 border-l-border" : ""
                  }`}
                >
                  <div className="text-[10px] text-muted-foreground">
                    {DAY_NAMES[d]}
                  </div>
                  <div>{p}</div>
                </th>
              ))
            )}
          </tr>
        </thead>
        <tbody>
          {filteredEntities.map((entity) => {
            const slotMap = entitySlotMap.get(entity.id)
            return (
              <tr key={entity.id} className="hover:bg-accent/30">
                <td className="sticky left-0 z-10 border bg-background px-2 py-1 font-medium whitespace-nowrap">
                  {entity.name}
                </td>
                {days.map((d) =>
                  periods.map((p) => {
                    const entry = slotMap?.get(`${d}-${p}`)
                    const subject = entry
                      ? subjectMap.get(entry.koma.subjectId)
                      : null
                    const highlightColor = subject
                      ? highlightMap.get(subject.id)
                      : null

                    return (
                      <td
                        key={`${d}-${p}`}
                        className={`border px-1 py-0.5 text-center ${
                          p === 1 ? "border-l-2 border-l-border" : ""
                        }`}
                        style={{
                          backgroundColor: highlightColor
                            ? `${highlightColor}30`
                            : subject?.color
                              ? `${subject.color}15`
                              : undefined,
                        }}
                      >
                        {subject && (
                          <span
                            className="text-[10px] leading-tight"
                            title={subject.name}
                          >
                            {subject.shortName || subject.name.slice(0, 2)}
                          </span>
                        )}
                      </td>
                    )
                  })
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
      {filteredEntities.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          {filterSubjectId
            ? "該当する教科の配置がありません"
            : "データがありません"}
        </div>
      )}
    </div>
  )
}
