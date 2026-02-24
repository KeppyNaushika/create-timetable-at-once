import type { Duty, Koma, SpecialRoom, Teacher } from "@/types/common.types"

import type {
  Assignment,
  ClassScheduleMap,
  DutyMap,
  KomaLookup,
  RoomAvailabilityMap,
  RoomScheduleMap,
  SlotPosition,
  SolverInput,
  TeacherAvailabilityMap,
  TeacherScheduleMap,
} from "./types"

export function buildKomaLookup(komas: Koma[]): KomaLookup {
  const lookup: KomaLookup = {}
  for (const koma of komas) {
    lookup[koma.id] = {
      ...koma,
      teacherIds: koma.komaTeachers?.map((kt) => kt.teacherId) ?? [],
      classIds: koma.komaClasses?.map((kc) => kc.classId) ?? [],
      roomIds: koma.komaRooms?.map((kr) => kr.roomId) ?? [],
    }
  }
  return lookup
}

export function buildTeacherAvailabilityMap(
  teachers: Teacher[]
): TeacherAvailabilityMap {
  const map: TeacherAvailabilityMap = {}
  for (const teacher of teachers) {
    map[teacher.id] = {}
    if (teacher.availabilities) {
      for (const a of teacher.availabilities) {
        if (!map[teacher.id][a.dayOfWeek]) {
          map[teacher.id][a.dayOfWeek] = {}
        }
        map[teacher.id][a.dayOfWeek][a.period] = a.status
      }
    }
  }
  return map
}

export function buildRoomAvailabilityMap(
  rooms: SpecialRoom[]
): RoomAvailabilityMap {
  const map: RoomAvailabilityMap = {}
  for (const room of rooms) {
    map[room.id] = {}
    if (room.availabilities) {
      for (const a of room.availabilities) {
        if (!map[room.id][a.dayOfWeek]) {
          map[room.id][a.dayOfWeek] = {}
        }
        map[room.id][a.dayOfWeek][a.period] = a.status
      }
    }
  }
  return map
}

export function buildDutyMap(duties: Duty[]): DutyMap {
  const map: DutyMap = {}
  for (const duty of duties) {
    if (duty.teacherDuties) {
      for (const td of duty.teacherDuties) {
        if (!map[td.teacherId]) map[td.teacherId] = {}
        if (!map[td.teacherId][duty.dayOfWeek]) {
          map[td.teacherId][duty.dayOfWeek] = new Set()
        }
        map[td.teacherId][duty.dayOfWeek].add(duty.period)
      }
    }
  }
  return map
}

export function buildScheduleMaps(
  assignments: Assignment[],
  komaLookup: KomaLookup
): {
  teacherMap: TeacherScheduleMap
  classMap: ClassScheduleMap
  roomMap: RoomScheduleMap
  komaSlotCount: Record<string, Record<string, number>>
} {
  const teacherMap: TeacherScheduleMap = {}
  const classMap: ClassScheduleMap = {}
  const roomMap: RoomScheduleMap = {}
  const komaSlotCount: Record<string, Record<string, number>> = {}

  for (const a of assignments) {
    const koma = komaLookup[a.komaId]
    if (!koma) continue

    for (const tid of koma.teacherIds) {
      if (!teacherMap[tid]) teacherMap[tid] = {}
      if (!teacherMap[tid][a.dayOfWeek]) teacherMap[tid][a.dayOfWeek] = {}
      teacherMap[tid][a.dayOfWeek][a.period] = a.komaId
    }

    for (const cid of koma.classIds) {
      if (!classMap[cid]) classMap[cid] = {}
      if (!classMap[cid][a.dayOfWeek]) classMap[cid][a.dayOfWeek] = {}
      classMap[cid][a.dayOfWeek][a.period] = a.komaId
    }

    for (const rid of koma.roomIds) {
      if (!roomMap[rid]) roomMap[rid] = {}
      if (!roomMap[rid][a.dayOfWeek]) roomMap[rid][a.dayOfWeek] = {}
      roomMap[rid][a.dayOfWeek][a.period] = a.komaId
    }

    // komaSlotCount を構築
    const slotKey = `${a.dayOfWeek}:${a.period}`
    if (!komaSlotCount[a.komaId]) komaSlotCount[a.komaId] = {}
    komaSlotCount[a.komaId][slotKey] =
      (komaSlotCount[a.komaId][slotKey] ?? 0) + 1
  }

  return { teacherMap, classMap, roomMap, komaSlotCount }
}

export function getTeacherDaySlots(
  teacherMap: TeacherScheduleMap,
  teacherId: string,
  dayOfWeek: number
): number[] {
  const day = teacherMap[teacherId]?.[dayOfWeek]
  if (!day) return []
  return Object.keys(day)
    .map(Number)
    .filter((p) => day[p] != null)
    .sort((a, b) => a - b)
}

export function countTeacherWeekSlots(
  teacherMap: TeacherScheduleMap,
  teacherId: string
): number {
  let count = 0
  const days = teacherMap[teacherId]
  if (!days) return 0
  for (const day of Object.values(days)) {
    for (const komaId of Object.values(day)) {
      if (komaId != null) count++
    }
  }
  return count
}

export function parseDisabledSlots(json: string): Set<string> {
  try {
    const arr = JSON.parse(json)
    if (!Array.isArray(arr)) return new Set()
    return new Set(
      arr.map(
        (s: { dayOfWeek: number; period: number }) =>
          `${s.dayOfWeek}:${s.period}`
      )
    )
  } catch {
    return new Set()
  }
}

export function getAllSlotPositions(input: SolverInput): SlotPosition[] {
  const disabled = parseDisabledSlots(input.school.disabledSlotsJson)
  const positions: SlotPosition[] = []
  for (let d = 0; d < input.school.daysPerWeek; d++) {
    const startPeriod = input.school.hasZeroPeriod ? 0 : 1
    for (let p = startPeriod; p <= input.school.maxPeriodsPerDay; p++) {
      if (disabled.has(`${d}:${p}`)) continue
      positions.push({ dayOfWeek: d, period: p })
    }
  }
  return positions
}

export function expandKomasToAssignmentTargets(
  komas: Koma[]
): { komaId: string; index: number }[] {
  const targets: { komaId: string; index: number }[] = []
  for (const koma of komas) {
    for (let i = 0; i < koma.count; i++) {
      targets.push({ komaId: koma.id, index: i })
    }
  }
  return targets
}
