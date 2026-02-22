import type { Koma, TimetableSlot } from "./common.types"

// セル表示情報
export interface TimetableCell {
  slot: TimetableSlot | null
  koma: Koma | null
  violations: CellViolation[]
  isFixed: boolean
}

export interface CellViolation {
  type: string
  message: string
  severity: "error" | "warning"
}

// 表示モード
export type ViewMode = "teacher" | "class" | "room"

// D&Dアイテム
export interface DragItem {
  type: "koma"
  komaId: string
  fromSlotId?: string
  fromDayOfWeek?: number
  fromPeriod?: number
}

// ドロップターゲット
export interface DropTarget {
  dayOfWeek: number
  period: number
}

// エディタのアクション
export type TimetableAction =
  | {
      type: "PLACE"
      komaId: string
      dayOfWeek: number
      period: number
      slotId?: string
    }
  | {
      type: "REMOVE"
      slotId: string
      komaId: string
      dayOfWeek: number
      period: number
    }
  | {
      type: "MOVE"
      slotId: string
      komaId: string
      fromDay: number
      fromPeriod: number
      toDay: number
      toPeriod: number
    }
  | { type: "FIX"; slotId: string; isFixed: boolean }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "LOAD"; slots: TimetableSlot[] }
  | { type: "CLEAR"; keepFixed: boolean }

// エディタ状態
export interface TimetableEditorState {
  slots: TimetableSlot[]
  past: TimetableSlot[][]
  future: TimetableSlot[][]
  selectedKomaId: string | null
  selectedSlot: { dayOfWeek: number; period: number } | null
}
