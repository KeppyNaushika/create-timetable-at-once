"use client"

import { useCallback, useEffect, useState } from "react"

import type {
  School,
  Teacher,
  ClassInfo,
  Subject,
  SpecialRoom,
  Duty,
  Koma,
  TimetablePattern,
  TimetableSlot,
  Grade,
} from "@/types/common.types"

export interface TimetableData {
  school: School | null
  grades: Grade[]
  teachers: Teacher[]
  classes: ClassInfo[]
  subjects: Subject[]
  rooms: SpecialRoom[]
  duties: Duty[]
  komas: Koma[]
  adoptedPattern: TimetablePattern | null
  slots: TimetableSlot[]
}

export function useTimetableData() {
  const [data, setData] = useState<TimetableData>({
    school: null,
    grades: [],
    teachers: [],
    classes: [],
    subjects: [],
    rooms: [],
    duties: [],
    komas: [],
    adoptedPattern: null,
    slots: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [school, teachers, classes, subjects, rooms, duties, komas, patterns, grades] =
        await Promise.all([
          window.electronAPI.schoolGet(),
          window.electronAPI.teacherGetAll(),
          window.electronAPI.classGetAll(),
          window.electronAPI.subjectGetAll(),
          window.electronAPI.roomGetAll(),
          window.electronAPI.dutyGetAll(),
          window.electronAPI.komaGetAll(),
          window.electronAPI.patternGetAll(),
          window.electronAPI.gradeGetAll(),
        ])

      const adopted = patterns.find(
        (p: TimetablePattern) => p.status === "adopted"
      )
      let slots: TimetableSlot[] = []
      if (adopted) {
        const patternWithSlots = await window.electronAPI.patternGetWithSlots(
          adopted.id
        )
        slots = patternWithSlots?.slots ?? []
      }

      setData({
        school,
        grades,
        teachers,
        classes,
        subjects,
        rooms,
        duties,
        komas,
        adoptedPattern: adopted ?? null,
        slots,
      })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "データの取得に失敗しました"
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return { data, loading, error, refetch: fetchAll }
}
