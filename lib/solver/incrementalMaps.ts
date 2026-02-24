import type { ConstraintContext } from "./constraints"
import { computeKomaPlacementCost } from "./constraints"
import type { Assignment, KomaLookup, SlotPosition } from "./types"

// ── スロットインデックス: スロット→コマIDのSet ──

export interface SlotIndex {
  [slotKey: string]: Set<string>
}

function slotKey(day: number, period: number): string {
  return `${day}:${period}`
}

export function buildSlotIndex(
  _ctx: ConstraintContext,
  assignments?: Assignment[]
): SlotIndex {
  const idx: SlotIndex = {}
  if (assignments) {
    // アサインメント配列から構築（単一値classMapの制限を回避）
    for (const a of assignments) {
      const key = slotKey(a.dayOfWeek, a.period)
      if (!idx[key]) idx[key] = new Set()
      idx[key].add(a.komaId)
    }
  }
  return idx
}

// ── インクリメンタルマップ操作 ──

export function addToMaps(
  ctx: ConstraintContext,
  komaLookup: KomaLookup,
  komaId: string,
  pos: SlotPosition,
  slotIdx?: SlotIndex
): void {
  const koma = komaLookup[komaId]
  if (!koma) return

  for (const tid of koma.teacherIds) {
    if (!ctx.teacherMap[tid]) ctx.teacherMap[tid] = {}
    if (!ctx.teacherMap[tid][pos.dayOfWeek])
      ctx.teacherMap[tid][pos.dayOfWeek] = {}
    ctx.teacherMap[tid][pos.dayOfWeek][pos.period] = komaId
  }
  for (const cid of koma.classIds) {
    if (!ctx.classMap[cid]) ctx.classMap[cid] = {}
    if (!ctx.classMap[cid][pos.dayOfWeek]) ctx.classMap[cid][pos.dayOfWeek] = {}
    ctx.classMap[cid][pos.dayOfWeek][pos.period] = komaId
  }
  for (const rid of koma.roomIds) {
    if (!ctx.roomMap[rid]) ctx.roomMap[rid] = {}
    if (!ctx.roomMap[rid][pos.dayOfWeek]) ctx.roomMap[rid][pos.dayOfWeek] = {}
    ctx.roomMap[rid][pos.dayOfWeek][pos.period] = komaId
  }

  // komaSlotCount をインクリメント
  if (ctx.komaSlotCount) {
    const sk = `${pos.dayOfWeek}:${pos.period}`
    if (!ctx.komaSlotCount[komaId]) ctx.komaSlotCount[komaId] = {}
    ctx.komaSlotCount[komaId][sk] = (ctx.komaSlotCount[komaId][sk] ?? 0) + 1
  }

  if (slotIdx) {
    const key = slotKey(pos.dayOfWeek, pos.period)
    if (!slotIdx[key]) slotIdx[key] = new Set()
    slotIdx[key].add(komaId)
  }
}

export function removeFromMaps(
  ctx: ConstraintContext,
  komaLookup: KomaLookup,
  komaId: string,
  pos: SlotPosition,
  slotIdx?: SlotIndex
): void {
  const koma = komaLookup[komaId]
  if (!koma) return

  for (const tid of koma.teacherIds) {
    if (ctx.teacherMap[tid]?.[pos.dayOfWeek]?.[pos.period] === komaId) {
      delete ctx.teacherMap[tid][pos.dayOfWeek][pos.period]
    }
  }
  for (const cid of koma.classIds) {
    if (ctx.classMap[cid]?.[pos.dayOfWeek]?.[pos.period] === komaId) {
      delete ctx.classMap[cid][pos.dayOfWeek][pos.period]
    }
  }
  for (const rid of koma.roomIds) {
    if (ctx.roomMap[rid]?.[pos.dayOfWeek]?.[pos.period] === komaId) {
      delete ctx.roomMap[rid][pos.dayOfWeek][pos.period]
    }
  }

  // komaSlotCount をデクリメント
  if (ctx.komaSlotCount) {
    const sk = `${pos.dayOfWeek}:${pos.period}`
    if (ctx.komaSlotCount[komaId]?.[sk]) {
      ctx.komaSlotCount[komaId][sk]--
      if (ctx.komaSlotCount[komaId][sk] <= 0) {
        delete ctx.komaSlotCount[komaId][sk]
      }
    }
  }

  if (slotIdx) {
    const key = slotKey(pos.dayOfWeek, pos.period)
    slotIdx[key]?.delete(komaId)
  }
}

// ── 違反インデックス (配列インデックスベース) ──

export interface ViolationIndex {
  costByIndex: number[] // assignment配列インデックス → コスト
  violatingIndices: number[] // コスト降順ソート
  totalScore: number
}

export function buildViolationIndex(
  ctx: ConstraintContext,
  komaLookup: KomaLookup,
  assignments: Assignment[]
): ViolationIndex {
  const costByIndex = new Array<number>(assignments.length).fill(0)
  let totalScore = 0

  for (let i = 0; i < assignments.length; i++) {
    const a = assignments[i]
    const pos: SlotPosition = { dayOfWeek: a.dayOfWeek, period: a.period }

    // 一時的にマップから除去してコスト計算（+1カウントが正しく機能する）
    removeFromMaps(ctx, komaLookup, a.komaId, pos)
    const cost = computeKomaPlacementCost(ctx, a.komaId, pos)
    addToMaps(ctx, komaLookup, a.komaId, pos)

    costByIndex[i] = cost
    totalScore += cost
  }

  const violatingIndices = buildSortedViolatingIndices(costByIndex)
  return { costByIndex, violatingIndices, totalScore }
}

export function updateViolationIndex(
  vi: ViolationIndex,
  affectedIndices: Set<number>,
  ctx: ConstraintContext,
  komaLookup: KomaLookup,
  assignments: Assignment[]
): void {
  for (const i of affectedIndices) {
    if (i >= assignments.length) continue
    const a = assignments[i]
    const pos: SlotPosition = { dayOfWeek: a.dayOfWeek, period: a.period }

    const oldCost = vi.costByIndex[i]

    removeFromMaps(ctx, komaLookup, a.komaId, pos)
    const newCost = computeKomaPlacementCost(ctx, a.komaId, pos)
    addToMaps(ctx, komaLookup, a.komaId, pos)

    vi.costByIndex[i] = newCost
    vi.totalScore += newCost - oldCost
  }

  vi.violatingIndices = buildSortedViolatingIndices(vi.costByIndex)
}

function buildSortedViolatingIndices(costByIndex: number[]): number[] {
  const result: number[] = []
  for (let i = 0; i < costByIndex.length; i++) {
    if (costByIndex[i] > 0) result.push(i)
  }
  result.sort((a, b) => costByIndex[b] - costByIndex[a])
  return result
}

// ── 影響範囲取得 ──

export function getAffectedIndices(
  ctx: ConstraintContext,
  komaLookup: KomaLookup,
  komaId: string,
  pos: SlotPosition,
  slotIdx: SlotIndex,
  indicesForKoma: Map<string, number[]>
): Set<number> {
  const affectedBaseIds = new Set<string>()
  affectedBaseIds.add(komaId)

  // 同一スロットにあるコマ
  const key = slotKey(pos.dayOfWeek, pos.period)
  const atSlot = slotIdx[key]
  if (atSlot) {
    for (const id of atSlot) affectedBaseIds.add(id)
  }

  // 同一リソースを共有するコマ（同日）
  const koma = komaLookup[komaId]
  if (koma) {
    for (const tid of koma.teacherIds) {
      const dayMap = ctx.teacherMap[tid]?.[pos.dayOfWeek]
      if (dayMap) {
        for (const kid of Object.values(dayMap)) {
          if (kid) affectedBaseIds.add(kid)
        }
      }
    }
    for (const cid of koma.classIds) {
      const dayMap = ctx.classMap[cid]?.[pos.dayOfWeek]
      if (dayMap) {
        for (const kid of Object.values(dayMap)) {
          if (kid) affectedBaseIds.add(kid)
        }
      }
    }
  }

  // base komaId → 配列インデックスに展開
  const affectedIdx = new Set<number>()
  for (const baseId of affectedBaseIds) {
    const indices = indicesForKoma.get(baseId)
    if (indices) {
      for (const idx of indices) affectedIdx.add(idx)
    }
  }

  return affectedIdx
}
