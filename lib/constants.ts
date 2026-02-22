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
