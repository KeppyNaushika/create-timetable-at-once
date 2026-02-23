"use client"

import { useCallback, useState } from "react"

import type { HourCountRow, HourCountByTeacherRow } from "@/types/daily.types"
import type {
  Koma,
  ClassInfo,
  Subject,
  Teacher,
  TimetablePattern,
  TimetableSlot,
} from "@/types/common.types"

export function useHourCount() {
  const [hourCounts, setHourCounts] = useState<HourCountRow[]>([])
  const [teacherCounts, setTeacherCounts] = useState<HourCountByTeacherRow[]>(
    []
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculateHours = useCallback(
    async (params: { patternId: string }) => {
      try {
        setLoading(true)
        setError(null)

        const [patternWithSlots, komas, classes, subjects, teachers] =
          await Promise.all([
            window.electronAPI.patternGetWithSlots(params.patternId),
            window.electronAPI.komaGetAll(),
            window.electronAPI.classGetAll(),
            window.electronAPI.subjectGetAll(),
            window.electronAPI.teacherGetAll(),
          ])

        if (!patternWithSlots) {
          throw new Error("パターンが見つかりません")
        }

        const slots = patternWithSlots.slots ?? []

        const subjectMap = new Map<string, Subject>()
        for (const s of subjects) {
          subjectMap.set(s.id, s)
        }

        const classMap = new Map<string, ClassInfo>()
        for (const c of classes) {
          classMap.set(c.id, c)
        }

        const teacherMap = new Map<string, Teacher>()
        for (const t of teachers) {
          teacherMap.set(t.id, t)
        }

        // Count actual placements per koma
        const slotCountByKomaId = new Map<string, number>()
        for (const slot of slots) {
          slotCountByKomaId.set(
            slot.komaId,
            (slotCountByKomaId.get(slot.komaId) ?? 0) + 1
          )
        }

        // Build hour counts per subject per class
        const hourCountKey = (subjectId: string, classId: string) =>
          `${subjectId}__${classId}`
        const plannedMap = new Map<string, number>()
        const actualMap = new Map<string, number>()
        const subjectClassPairs = new Set<string>()

        for (const koma of komas) {
          const komaClasses = koma.komaClasses ?? []
          const actual = slotCountByKomaId.get(koma.id) ?? 0

          for (const kc of komaClasses) {
            const key = hourCountKey(koma.subjectId, kc.classId)
            subjectClassPairs.add(key)
            plannedMap.set(key, (plannedMap.get(key) ?? 0) + koma.count)
            actualMap.set(key, (actualMap.get(key) ?? 0) + actual)
          }
        }

        const rows: HourCountRow[] = []
        for (const key of subjectClassPairs) {
          const [subjectId, classId] = key.split("__")
          const subject = subjectMap.get(subjectId)
          const cls = classMap.get(classId)
          const planned = plannedMap.get(key) ?? 0
          const actual = actualMap.get(key) ?? 0
          rows.push({
            subjectId,
            subjectName: subject?.name ?? subjectId,
            classId,
            className: cls?.name ?? classId,
            planned,
            actual,
            diff: actual - planned,
          })
        }

        setHourCounts(rows)

        // Build teacher hour counts
        const teacherPlannedMap = new Map<string, number>()
        const teacherActualMap = new Map<string, number>()
        const teacherIds = new Set<string>()

        for (const koma of komas) {
          const komaTeachers = koma.komaTeachers ?? []
          const actual = slotCountByKomaId.get(koma.id) ?? 0

          for (const kt of komaTeachers) {
            teacherIds.add(kt.teacherId)
            teacherPlannedMap.set(
              kt.teacherId,
              (teacherPlannedMap.get(kt.teacherId) ?? 0) + koma.count
            )
            teacherActualMap.set(
              kt.teacherId,
              (teacherActualMap.get(kt.teacherId) ?? 0) + actual
            )
          }
        }

        const teacherRows: HourCountByTeacherRow[] = []
        for (const tid of teacherIds) {
          const teacher = teacherMap.get(tid)
          const planned = teacherPlannedMap.get(tid) ?? 0
          const actual = teacherActualMap.get(tid) ?? 0
          teacherRows.push({
            teacherId: tid,
            teacherName: teacher?.name ?? tid,
            planned,
            actual,
            diff: actual - planned,
          })
        }

        setTeacherCounts(teacherRows)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "時数集計の計算に失敗しました"
        )
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    hourCounts,
    teacherCounts,
    loading,
    error,
    calculateHours,
  }
}
