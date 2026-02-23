"use client"

import { useCallback, useState } from "react"

import type {
  ElectiveStudent,
  ElectiveResult,
  ElectiveGroup,
} from "@/types/exam.types"

export function useElective() {
  const [students, setStudents] = useState<ElectiveStudent[]>([])
  const [result, setResult] = useState<ElectiveResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const importCsv = useCallback((csvText: string) => {
    try {
      setError(null)
      const lines = csvText.trim().split("\n")
      if (lines.length < 2) {
        throw new Error("CSVデータが不足しています（ヘッダー+1行以上必要）")
      }

      // Skip header line
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

      setStudents(parsed)
      setResult(null)
      return parsed
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "CSVの解析に失敗しました"
      )
      throw err
    }
  }, [])

  const optimize = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (students.length === 0) {
        throw new Error("生徒データがありません。先にCSVを読み込んでください。")
      }

      // Collect all unique subjects from student choices
      const subjectSet = new Set<string>()
      for (const s of students) {
        for (const c of s.choices) {
          subjectSet.add(c)
        }
      }

      // Greedy assignment: assign each student to their first available choice
      const groups = new Map<string, string[]>()
      for (const subj of subjectSet) {
        groups.set(subj, [])
      }

      const assigned = new Set<string>()
      const unassigned: string[] = []

      // First pass: assign students to their first choice
      for (const student of students) {
        let placed = false
        for (const choice of student.choices) {
          if (groups.has(choice)) {
            groups.get(choice)!.push(student.id)
            assigned.add(student.id)
            placed = true
            break
          }
        }
        if (!placed) {
          unassigned.push(student.id)
        }
      }

      // Build result groups
      const electiveGroups: ElectiveGroup[] = []
      let period = 1
      for (const [subjectName, studentIds] of groups) {
        if (studentIds.length > 0) {
          electiveGroups.push({
            subjectName,
            students: studentIds,
            period,
          })
          period++
        }
      }

      // Score: percentage of students assigned to their first choice
      const score =
        students.length > 0
          ? Math.round((assigned.size / students.length) * 100)
          : 0

      const optimizeResult: ElectiveResult = {
        groups: electiveGroups,
        unassigned,
        score,
      }

      setResult(optimizeResult)
      return optimizeResult
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "選択科目の最適化に失敗しました"
      )
      throw err
    } finally {
      setLoading(false)
    }
  }, [students])

  const clearAll = useCallback(() => {
    setStudents([])
    setResult(null)
    setError(null)
  }, [])

  return {
    students,
    result,
    loading,
    error,
    importCsv,
    optimize,
    clearAll,
  }
}
