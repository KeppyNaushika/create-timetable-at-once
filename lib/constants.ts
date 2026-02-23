export const DAY_NAMES = ["月", "火", "水", "木", "金", "土"] as const

export const DAY_NAMES_FULL = [
  "月曜日",
  "火曜日",
  "水曜日",
  "木曜日",
  "金曜日",
  "土曜日",
] as const

export const SUBJECT_CATEGORIES = {
  general: "一般教科",
  reserve: "予備（学活・道徳・総合等）",
  school_affair: "校務",
} as const

export const DEFAULT_SUBJECT_COLORS: Record<string, string> = {
  国語: "#EF4444",
  社会: "#F59E0B",
  数学: "#3B82F6",
  理科: "#10B981",
  英語: "#8B5CF6",
  音楽: "#EC4899",
  美術: "#F97316",
  保健体育: "#06B6D4",
  "技術・家庭": "#84CC16",
  道徳: "#A855F7",
  学活: "#64748B",
  総合: "#14B8A6",
  職員会議: "#9CA3AF",
  研修: "#78716C",
}

export const AVAILABILITY_STATUS = {
  available: "可",
  unavailable: "不可",
  preferred: "希望",
} as const

export const ROOM_AVAILABILITY_STATUS = {
  available: "可",
  unavailable: "不可",
} as const

export const KOMA_TYPES = {
  normal: "普通",
  consecutive: "連続",
} as const

export const KOMA_TEACHER_ROLES = {
  main: "主",
  sub: "副",
} as const

// ========== Phase 3: 制約条件 ==========

export const CONSTRAINT_LEVELS = {
  forbidden: "禁止",
  consider: "考慮",
  ignore: "無視",
  manual_only: "手動のみ",
} as const

export type ConstraintLevel = keyof typeof CONSTRAINT_LEVELS

export interface ConstraintFieldDef {
  key: string
  label: string
  category: "teacher" | "class" | "room" | "duty" | "koma" | "balance"
  description: string
  allowedLevels: ConstraintLevel[]
}

export const CONSTRAINT_FIELDS: ConstraintFieldDef[] = [
  {
    key: "teacherAvailability",
    label: "先生の都合",
    category: "teacher",
    description: "先生が不可・希望と設定した時間帯を守る",
    allowedLevels: ["forbidden", "consider", "ignore"],
  },
  {
    key: "teacherMaxPerDay",
    label: "先生1日の最大コマ数",
    category: "teacher",
    description: "先生の1日あたり授業数上限を守る",
    allowedLevels: ["forbidden", "consider", "ignore"],
  },
  {
    key: "teacherMaxConsecutive",
    label: "先生の連続授業制限",
    category: "teacher",
    description: "先生の連続授業数上限を守る",
    allowedLevels: ["forbidden", "consider", "ignore"],
  },
  {
    key: "teacherMaxPerWeek",
    label: "先生週あたり最大コマ数",
    category: "teacher",
    description: "先生の週あたり授業数上限を守る",
    allowedLevels: ["forbidden", "consider", "ignore"],
  },
  {
    key: "classSameSubjectPerDay",
    label: "クラス同一教科1日制限",
    category: "class",
    description: "同じクラスに同一教科が1日に複数回入らないようにする",
    allowedLevels: ["forbidden", "consider", "ignore"],
  },
  {
    key: "classConsecutiveSame",
    label: "クラス同一教科連続不可",
    category: "class",
    description: "同じクラスに同一教科が連続して入らないようにする",
    allowedLevels: ["forbidden", "consider", "ignore"],
  },
  {
    key: "roomConflict",
    label: "教室重複禁止",
    category: "room",
    description: "同一教室に複数の授業を同時配置しない",
    allowedLevels: ["forbidden", "consider", "ignore"],
  },
  {
    key: "roomAvailability",
    label: "教室利用可能時間",
    category: "room",
    description: "教室が利用不可の時間帯に配置しない",
    allowedLevels: ["forbidden", "consider", "ignore"],
  },
  {
    key: "dutyConflict",
    label: "校務時間帯不可",
    category: "duty",
    description: "先生の校務担当時間帯に授業を配置しない",
    allowedLevels: ["forbidden", "consider", "ignore"],
  },
  {
    key: "consecutiveKoma",
    label: "連続駒の隣接配置",
    category: "koma",
    description: "連続タイプの駒を隣接する時限に配置する",
    allowedLevels: ["forbidden", "consider", "ignore"],
  },
  {
    key: "dailyBalance",
    label: "曜日間コマ数均等化",
    category: "balance",
    description: "各先生のコマ数を曜日間で均等にする",
    allowedLevels: ["consider", "ignore"],
  },
]

export const PLACEMENT_RESTRICTIONS = {
  any: "制限なし",
  morning_only: "午前のみ",
  afternoon_only: "午後のみ",
  not_first: "1時限目不可",
  not_last: "最終時限不可",
} as const

// ========== Phase 4: 確認・出力 ==========

export const PAPER_SIZES = {
  B4: { label: "B4横", width: 364, height: 257 },
  A4: { label: "A4横(80%)", width: 297, height: 210 },
  A3: { label: "A3横", width: 420, height: 297 },
} as const

export const LINE_STYLES = {
  none: "なし",
  thin: "細線",
  thick: "太線",
  double: "二重線",
  dotted: "点線",
} as const

export const OUTPUT_ORDERS = {
  grade: "学年順",
  name: "名前順",
  nameKana: "カナ順",
} as const

export const REPORT_TYPES = {
  "teacher-all": "先生全体表",
  "class-all": "クラス全体表",
  "teacher-schedule": "先生用時間割",
  "class-schedule": "クラス用時間割",
  "room-schedule": "特別教室用時間割",
  "duty-list": "校務一覧表",
  "teacher-list": "先生一覧表",
  "koma-list": "駒一覧",
  "remaining-koma": "残り駒一覧",
} as const

export const HIGHLIGHT_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FFA07A",
] as const

export const COLOR_PALETTE = [
  "#EF4444",
  "#F59E0B",
  "#3B82F6",
  "#10B981",
  "#8B5CF6",
  "#EC4899",
  "#F97316",
  "#06B6D4",
  "#84CC16",
  "#A855F7",
  "#14B8A6",
  "#64748B",
  "#9CA3AF",
  "#78716C",
  "#DC2626",
  "#D97706",
  "#2563EB",
  "#059669",
  "#7C3AED",
  "#DB2777",
]
