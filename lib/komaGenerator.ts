// 学習指導要領に基づく中学校の標準時間割プリセット
// 年間授業時数を35週で割った週あたりの時間数(概算)

interface CurriculumItem {
  subjectName: string
  weeklyHours: number
  type?: "normal" | "consecutive"
}

// 学年別プリセット (中学校)
export const CURRICULUM_PRESETS: Record<number, CurriculumItem[]> = {
  1: [
    { subjectName: "国語", weeklyHours: 4 },
    { subjectName: "社会", weeklyHours: 3 },
    { subjectName: "数学", weeklyHours: 4 },
    { subjectName: "理科", weeklyHours: 3 },
    { subjectName: "英語", weeklyHours: 4 },
    { subjectName: "音楽", weeklyHours: 1 },
    { subjectName: "美術", weeklyHours: 1 },
    { subjectName: "保健体育", weeklyHours: 3 },
    { subjectName: "技術・家庭", weeklyHours: 2 },
    { subjectName: "道徳", weeklyHours: 1 },
    { subjectName: "学活", weeklyHours: 1 },
    { subjectName: "総合", weeklyHours: 2 },
  ],
  2: [
    { subjectName: "国語", weeklyHours: 4 },
    { subjectName: "社会", weeklyHours: 3 },
    { subjectName: "数学", weeklyHours: 3 },
    { subjectName: "理科", weeklyHours: 4 },
    { subjectName: "英語", weeklyHours: 4 },
    { subjectName: "音楽", weeklyHours: 1 },
    { subjectName: "美術", weeklyHours: 1 },
    { subjectName: "保健体育", weeklyHours: 3 },
    { subjectName: "技術・家庭", weeklyHours: 2 },
    { subjectName: "道徳", weeklyHours: 1 },
    { subjectName: "学活", weeklyHours: 1 },
    { subjectName: "総合", weeklyHours: 2 },
  ],
  3: [
    { subjectName: "国語", weeklyHours: 3 },
    { subjectName: "社会", weeklyHours: 4 },
    { subjectName: "数学", weeklyHours: 4 },
    { subjectName: "理科", weeklyHours: 4 },
    { subjectName: "英語", weeklyHours: 4 },
    { subjectName: "音楽", weeklyHours: 1 },
    { subjectName: "美術", weeklyHours: 1 },
    { subjectName: "保健体育", weeklyHours: 3 },
    { subjectName: "技術・家庭", weeklyHours: 1 },
    { subjectName: "道徳", weeklyHours: 1 },
    { subjectName: "学活", weeklyHours: 1 },
    { subjectName: "総合", weeklyHours: 2 },
  ],
}

/**
 * プリセット設定から駒生成用のデータ配列を生成する純粋関数
 */
export function generateKomasFromPreset(
  preset: Record<
    string,
    { count: number; type: string; enabled: boolean }
  >,
  gradeId: string,
  subjects: { id: string; name: string }[]
): { subjectId: string; gradeId: string; type: string; count: number }[] {
  const result: {
    subjectId: string
    gradeId: string
    type: string
    count: number
  }[] = []

  for (const [subjectId, config] of Object.entries(preset)) {
    if (!config.enabled || config.count <= 0) continue
    const subject = subjects.find((s) => s.id === subjectId)
    if (!subject) continue

    result.push({
      subjectId,
      gradeId,
      type: config.type,
      count: config.count,
    })
  }

  return result
}
