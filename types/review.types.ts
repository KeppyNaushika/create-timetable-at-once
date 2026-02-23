// Phase 4: 確認・出力モジュール型定義

// 診断カテゴリ
export type DiagnosisCategory =
  | "constraintViolation"
  | "teacherLoadBalance"
  | "classGapAnalysis"
  | "roomUtilization"
  | "subjectDistribution"

// 診断グレード（A=最良, E=最悪）
export type DiagnosisGrade = "A" | "B" | "C" | "D" | "E"

// カテゴリ別診断結果
export interface CategoryDiagnosis {
  category: DiagnosisCategory
  label: string
  grade: DiagnosisGrade
  score: number // 0-100
  details: string[]
  suggestions: string[]
}

// 全体診断結果
export interface DiagnosisResult {
  overallGrade: DiagnosisGrade
  overallScore: number // 0-100
  categories: CategoryDiagnosis[]
  totalViolations: number
  timestamp: string
}

// 教科ハイライト設定
export interface SubjectHighlight {
  subjectId: string
  color: string
}

// 帳票タイプ
export type ReportType =
  | "teacher-all"
  | "class-all"
  | "teacher-schedule"
  | "class-schedule"
  | "room-schedule"
  | "duty-list"
  | "teacher-list"
  | "koma-list"
  | "remaining-koma"

// 用紙サイズ
export type PaperSize = "B4" | "A4" | "A3"

// 罫線スタイル
export type LineStyle = "none" | "thin" | "thick" | "double" | "dotted"

// 罫線設定
export interface GridLineConfig {
  outer: LineStyle
  inner: LineStyle
  dayDivider: LineStyle
  weekDivider: LineStyle
}

// 出力順序
export type OutputOrder = "grade" | "name" | "nameKana"

// 印刷設定
export interface PrintSettings {
  paperSize: PaperSize
  gridLines: GridLineConfig
  outputOrder: OutputOrder
  footer: string
  selectedIds: string[] // 出力対象エンティティID
}
