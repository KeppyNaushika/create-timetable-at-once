import type {
  ClassInfo,
  Duty,
  Grade,
  Koma,
  ScheduleCondition,
  School,
  SpecialRoom,
  Subject,
  Teacher,
  TeacherAvailability,
  TimetableSlot,
} from "@/types/common.types"

// ソルバーに渡す全データ
export interface SolverInput {
  school: School
  grades: Grade[]
  classes: ClassInfo[]
  teachers: Teacher[]
  subjects: Subject[]
  rooms: SpecialRoom[]
  duties: Duty[]
  komas: Koma[]
  condition: ScheduleCondition
  fixedSlots: TimetableSlot[]
}

// スロット位置
export interface SlotPosition {
  dayOfWeek: number
  period: number
}

// 配置エントリ
export interface Assignment {
  komaId: string
  dayOfWeek: number
  period: number
}

// 違反情報
export interface Violation {
  type: string
  severity: "error" | "warning" | "info"
  message: string
  komaId?: string
  teacherId?: string
  classId?: string
  roomId?: string
  dayOfWeek?: number
  period?: number
  weight: number
}

// ソルバー設定
export interface SolverConfig {
  maxTimeMs: number // タイムアウト（ミリ秒）
  maxPatterns: number // 生成パターン数
  seed?: number // 乱数シード
  saInitialTemp: number // SA初期温度
  saCoolingRate: number // SA冷却率
  saIterations: number // SAイテレーション数
  btMaxDepth: number // バックトラック最大深度
  ilsRestarts: number // ILSリスタート回数
}

export const DEFAULT_SOLVER_CONFIG: SolverConfig = {
  maxTimeMs: 60000,
  maxPatterns: 3,
  seed: undefined,
  saInitialTemp: 1000,
  saCoolingRate: 0.9995,
  saIterations: 100000,
  btMaxDepth: 500,
  ilsRestarts: 5,
}

// ソルバー進捗
export interface SolverProgress {
  phase: "propagation" | "backtrack" | "annealing" | "chain" | "construction" | "localSearch" | "done" | "error"
  phaseLabel: string
  patternIndex: number
  totalPatterns: number
  placedCount: number
  totalKomas: number
  violations: number
  score: number
  elapsedMs: number
  message?: string
}

// ソルバー結果
export interface SolverResult {
  assignments: Assignment[]
  violations: Violation[]
  score: number
  elapsedMs: number
  isComplete: boolean
  // 全パターンのスコア一覧（採用パターンのインデックス付き）
  allPatternScores?: { index: number; score: number; violations: number }[]
  selectedPatternIndex?: number
}

// Worker メッセージ型
export type WorkerMessage =
  | { type: "start"; input: SolverInput; config: SolverConfig }
  | { type: "abort" }

export type WorkerResponse =
  | { type: "progress"; data: SolverProgress }
  | { type: "result"; data: SolverResult }
  | { type: "error"; message: string }

// 高速ルックアップ用内部型
export interface TeacherScheduleMap {
  [teacherId: string]: {
    [dayOfWeek: number]: {
      [period: number]: string | null // komaId or null
    }
  }
}

export interface ClassScheduleMap {
  [classId: string]: {
    [dayOfWeek: number]: {
      [period: number]: string | null
    }
  }
}

export interface RoomScheduleMap {
  [roomId: string]: {
    [dayOfWeek: number]: {
      [period: number]: string | null
    }
  }
}

export interface TeacherAvailabilityMap {
  [teacherId: string]: {
    [dayOfWeek: number]: {
      [period: number]: string // "available" | "unavailable" | "preferred"
    }
  }
}

export interface RoomAvailabilityMap {
  [roomId: string]: {
    [dayOfWeek: number]: {
      [period: number]: string // "available" | "unavailable"
    }
  }
}

export interface DutyMap {
  [teacherId: string]: {
    [dayOfWeek: number]: Set<number> // periods
  }
}

export interface KomaLookup {
  [komaId: string]: Koma & {
    teacherIds: string[]
    classIds: string[]
    roomIds: string[]
  }
}

// 制約伝播用ドメイン
export interface Domain {
  [komaId: string]: SlotPosition[]
}
