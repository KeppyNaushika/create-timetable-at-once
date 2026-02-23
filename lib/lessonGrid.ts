import type { ClassInfo, Koma, Subject } from "@/types/common.types"

export interface TeacherDisplay {
  teacherId: string
  name: string
  role: "main" | "sub"
}

export interface CellData {
  komaId: string
  classIds: string[]
  teachers: TeacherDisplay[]
  colSpan: number
}

export interface SubjectRow {
  subjectId: string
  subjectName: string
  subjectColor: string
  hours: number
  cells: (CellData | "spanned" | null)[]
  komaIds: string[]
}

/**
 * Koma[] をスプレッドシート用の SubjectRow[] に変換する。
 * 各行 = 教科, 各セル = クラス列に対応する駒
 */
export function buildSubjectRows(
  komas: Koma[],
  subjects: Subject[],
  gradeClasses: ClassInfo[]
): SubjectRow[] {
  // 教科別にグループ化
  const groups = new Map<
    string,
    { subject: Subject; komas: Koma[] }
  >()

  for (const koma of komas) {
    const existing = groups.get(koma.subjectId)
    if (existing) {
      existing.komas.push(koma)
    } else {
      const subject = subjects.find((s) => s.id === koma.subjectId) ??
        koma.subject ?? {
          id: koma.subjectId,
          name: "不明",
          shortName: "?",
          color: "#999",
          category: "general",
          sortOrder: 999,
          isDefault: false,
          createdAt: "",
          updatedAt: "",
        }
      groups.set(koma.subjectId, { subject, komas: [koma] })
    }
  }

  const rows: SubjectRow[] = []

  for (const [subjectId, group] of groups) {
    const hours =
      group.komas.length > 0 ? group.komas[0].count : 0

    // クラスインデックス → CellData のマッピングを構築
    // 1つの駒が複数クラスを持つ場合（合同授業）、最も左のクラスインデックスに配置
    const classIndexToKoma = new Map<number, Koma>()

    for (const koma of group.komas) {
      const assignedClassIds =
        koma.komaClasses?.map((kc) => kc.classId) ?? []

      if (assignedClassIds.length === 0) {
        // クラス未割当の駒 → 空きスロットに配置
        for (let i = 0; i < gradeClasses.length; i++) {
          if (!classIndexToKoma.has(i)) {
            classIndexToKoma.set(i, koma)
            break
          }
        }
      } else {
        // 割当済み → 該当クラスのインデックスにマッピング
        const indices = assignedClassIds
          .map((cid) => gradeClasses.findIndex((c) => c.id === cid))
          .filter((i) => i >= 0)
          .sort((a, b) => a - b)

        if (indices.length > 0) {
          // 最も左のインデックスに駒を紐付け
          classIndexToKoma.set(indices[0], koma)
          // 合同授業: 残りのインデックスもこの駒が占める（spanned にする）
          for (let k = 1; k < indices.length; k++) {
            classIndexToKoma.set(indices[k], koma)
          }
        }
      }
    }

    // セル配列を構築
    const cells: (CellData | "spanned" | null)[] = []
    const seenKomaIds = new Set<string>()

    for (let i = 0; i < gradeClasses.length; i++) {
      const koma = classIndexToKoma.get(i)
      if (!koma) {
        cells.push(null)
        continue
      }

      if (seenKomaIds.has(koma.id)) {
        // 合同授業の2番目以降のクラス
        cells.push("spanned")
        continue
      }

      seenKomaIds.add(koma.id)

      const assignedClassIds =
        koma.komaClasses?.map((kc) => kc.classId) ?? []
      const indices = assignedClassIds
        .map((cid) => gradeClasses.findIndex((c) => c.id === cid))
        .filter((idx) => idx >= 0)
        .sort((a, b) => a - b)

      // colSpan: 連続するインデックスの数を数える
      let colSpan = 1
      if (indices.length > 1) {
        // 最小インデックスから連続する数
        for (let k = 1; k < indices.length; k++) {
          if (indices[k] === indices[k - 1] + 1) {
            colSpan++
          } else {
            break
          }
        }
      }

      const teachers: TeacherDisplay[] = (koma.komaTeachers ?? [])
        .map((kt) => ({
          teacherId: kt.teacherId,
          name: kt.teacher?.name ?? "不明",
          role: kt.role as "main" | "sub",
        }))
        .sort((a, b) => (a.role === "main" ? -1 : 1) - (b.role === "main" ? -1 : 1))

      cells.push({
        komaId: koma.id,
        classIds:
          assignedClassIds.length > 0
            ? assignedClassIds
            : [gradeClasses[i]?.id].filter(Boolean),
        teachers,
        colSpan,
      })
    }

    rows.push({
      subjectId,
      subjectName: group.subject.name,
      subjectColor: group.subject.color,
      hours,
      cells,
      komaIds: group.komas.map((k) => k.id),
    })
  }

  // sortOrder でソート
  const subjectOrder = new Map(subjects.map((s) => [s.id, s.sortOrder]))
  rows.sort(
    (a, b) =>
      (subjectOrder.get(a.subjectId) ?? 999) -
      (subjectOrder.get(b.subjectId) ?? 999)
  )

  return rows
}
