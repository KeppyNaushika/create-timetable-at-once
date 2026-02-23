"use client"

import { useCallback, useReducer } from "react"

import type { TimetableSlot } from "@/types/common.types"
import type {
  TimetableAction,
  TimetableEditorState,
} from "@/types/timetable.types"

const MAX_HISTORY = 50

function createSlot(
  komaId: string,
  dayOfWeek: number,
  period: number,
  slotId?: string
): TimetableSlot {
  return {
    id: slotId ?? `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    patternId: "",
    komaId,
    dayOfWeek,
    period,
    placedBy: "manual",
    isFixed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function reducer(
  state: TimetableEditorState,
  action: TimetableAction
): TimetableEditorState {
  switch (action.type) {
    case "PLACE": {
      const newSlot = createSlot(
        action.komaId,
        action.dayOfWeek,
        action.period,
        action.slotId
      )
      return {
        ...state,
        slots: [...state.slots, newSlot],
        past: [...state.past.slice(-MAX_HISTORY), state.slots],
        future: [],
        selectedKomaId: null,
        selectedSlot: null,
      }
    }

    case "REMOVE": {
      return {
        ...state,
        slots: state.slots.filter((s) => s.id !== action.slotId),
        past: [...state.past.slice(-MAX_HISTORY), state.slots],
        future: [],
      }
    }

    case "MOVE": {
      return {
        ...state,
        slots: state.slots.map((s) =>
          s.id === action.slotId
            ? { ...s, dayOfWeek: action.toDay, period: action.toPeriod }
            : s
        ),
        past: [...state.past.slice(-MAX_HISTORY), state.slots],
        future: [],
      }
    }

    case "SWAP": {
      // Atomic swap: A goes to B's position, B goes to A's position
      return {
        ...state,
        slots: state.slots.map((s) => {
          if (s.id === action.slotA.id) {
            return {
              ...s,
              id: action.newSlotAId,
              dayOfWeek: action.slotB.dayOfWeek,
              period: action.slotB.period,
            }
          }
          if (s.id === action.slotB.id) {
            return {
              ...s,
              id: action.newSlotBId,
              dayOfWeek: action.slotA.dayOfWeek,
              period: action.slotA.period,
            }
          }
          return s
        }),
        past: [...state.past.slice(-MAX_HISTORY), state.slots],
        future: [],
      }
    }

    case "UPDATE_SLOT_ID": {
      // Update slot ID without creating undo entry (for DB sync)
      return {
        ...state,
        slots: state.slots.map((s) =>
          s.id === action.oldId ? { ...s, id: action.newId } : s
        ),
      }
    }

    case "FIX": {
      return {
        ...state,
        slots: state.slots.map((s) =>
          s.id === action.slotId
            ? {
                ...s,
                isFixed: action.isFixed,
                placedBy: action.isFixed ? "fixed" : "manual",
              }
            : s
        ),
      }
    }

    case "UNDO": {
      if (state.past.length === 0) return state
      const prev = state.past[state.past.length - 1]
      return {
        ...state,
        slots: prev,
        past: state.past.slice(0, -1),
        future: [state.slots, ...state.future],
      }
    }

    case "REDO": {
      if (state.future.length === 0) return state
      const next = state.future[0]
      return {
        ...state,
        slots: next,
        past: [...state.past, state.slots],
        future: state.future.slice(1),
      }
    }

    case "LOAD": {
      return {
        ...state,
        slots: action.slots,
        past: [],
        future: [],
      }
    }

    case "CLEAR": {
      const remaining = action.keepFixed
        ? state.slots.filter((s) => s.isFixed)
        : []
      return {
        ...state,
        slots: remaining,
        past: [...state.past.slice(-MAX_HISTORY), state.slots],
        future: [],
      }
    }

    default:
      return state
  }
}

const initialState: TimetableEditorState = {
  slots: [],
  past: [],
  future: [],
  selectedKomaId: null,
  selectedSlot: null,
}

export function useTimetableEditor() {
  const [state, dispatch] = useReducer(reducer, initialState)

  const place = useCallback(
    (komaId: string, dayOfWeek: number, period: number, slotId?: string) => {
      dispatch({ type: "PLACE", komaId, dayOfWeek, period, slotId })
    },
    []
  )

  const remove = useCallback(
    (slotId: string, komaId: string, dayOfWeek: number, period: number) => {
      dispatch({ type: "REMOVE", slotId, komaId, dayOfWeek, period })
    },
    []
  )

  const move = useCallback(
    (
      slotId: string,
      komaId: string,
      fromDay: number,
      fromPeriod: number,
      toDay: number,
      toPeriod: number
    ) => {
      dispatch({
        type: "MOVE",
        slotId,
        komaId,
        fromDay,
        fromPeriod,
        toDay,
        toPeriod,
      })
    },
    []
  )

  const swap = useCallback(
    (
      slotA: { id: string; komaId: string; dayOfWeek: number; period: number },
      slotB: { id: string; komaId: string; dayOfWeek: number; period: number },
      newSlotAId: string,
      newSlotBId: string
    ) => {
      dispatch({ type: "SWAP", slotA, slotB, newSlotAId, newSlotBId })
    },
    []
  )

  const updateSlotId = useCallback((oldId: string, newId: string) => {
    dispatch({ type: "UPDATE_SLOT_ID", oldId, newId })
  }, [])

  const fix = useCallback((slotId: string, isFixed: boolean) => {
    dispatch({ type: "FIX", slotId, isFixed })
  }, [])

  const undo = useCallback(() => dispatch({ type: "UNDO" }), [])
  const redo = useCallback(() => dispatch({ type: "REDO" }), [])
  const load = useCallback(
    (slots: TimetableSlot[]) => dispatch({ type: "LOAD", slots }),
    []
  )
  const clear = useCallback(
    (keepFixed: boolean) => dispatch({ type: "CLEAR", keepFixed }),
    []
  )

  const canUndo = state.past.length > 0
  const canRedo = state.future.length > 0

  return {
    state,
    dispatch,
    place,
    remove,
    move,
    swap,
    updateSlotId,
    fix,
    undo,
    redo,
    load,
    clear,
    canUndo,
    canRedo,
  }
}
