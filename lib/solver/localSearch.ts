import type { ConstraintContext } from "./constraints"
import { computeKomaPlacementCost } from "./constraints"
import {
  addToMaps,
  buildSlotIndex,
  buildViolationIndex,
  getAffectedIndices,
  removeFromMaps,
  type SlotIndex,
  updateViolationIndex,
  type ViolationIndex,
} from "./incrementalMaps"
import { SeededRandom } from "./random"
import type {
  Assignment,
  KomaLookup,
  SlotPosition,
  SolverConfig,
  SolverProgress,
} from "./types"
import { buildScheduleMaps } from "./utils"

interface TabuEntry {
  assignmentIdx: number
  slotKey: string
  expiry: number
}

export function tabuSearch(
  ctx: ConstraintContext,
  initialAssignments: Assignment[],
  komaLookup: KomaLookup,
  allPositions: SlotPosition[],
  config: SolverConfig,
  onProgress?: (p: Partial<SolverProgress>) => void,
  deadlineMs?: number
): Assignment[] {
  const rng = new SeededRandom((config.seed ?? Date.now()) + 7777)
  const startTime = Date.now()
  const timeLimit = deadlineMs ?? config.maxTimeMs

  // 作業コピー
  const assignments = initialAssignments.map((a) => ({ ...a }))

  // komaId → 配列インデックスのマッピング
  const indicesForKoma = buildIndicesForKoma(assignments)

  // ctx マップ再構築
  rebuildCtxMaps(ctx, assignments, komaLookup)

  // スロットインデックス構築（アサインメントから直接構築して重複も正確に追跡）
  const slotIdx = buildSlotIndex(ctx, assignments)

  // 違反インデックス構築
  const vi = buildViolationIndex(ctx, komaLookup, assignments)

  // 最良解を保存
  let bestAssignments = assignments.map((a) => ({ ...a }))
  let bestScore = vi.totalScore

  if (bestScore === 0) return bestAssignments

  // タブーリスト
  const tabuList: TabuEntry[] = []
  let tabuTenure = 15
  let iteration = 0
  let lastImprovementTime = startTime
  let lastReportTime = startTime
  const maxRestarts = config.ilsRestarts ?? 5
  let restartCount = 0

  // 停滞リスタートの間隔（時間ベース）
  const RESTART_STAGNATION_MS = 3000

  while (Date.now() - startTime < timeLimit) {
    iteration++

    if (vi.totalScore === 0) break

    const _improved = selectAndApplyMove(
      ctx,
      assignments,
      komaLookup,
      allPositions,
      slotIdx,
      vi,
      tabuList,
      tabuTenure,
      iteration,
      bestScore,
      rng,
      indicesForKoma
    )

    if (vi.totalScore < bestScore) {
      bestScore = vi.totalScore
      bestAssignments = assignments.map((a) => ({ ...a }))
      lastImprovementTime = Date.now()
      tabuTenure = 15 // テニュアをリセット
      if (bestScore === 0) break
    }

    pruneTabuList(tabuList, iteration)

    // 時間ベースの停滞検出 → 多様化リスタート
    const now = Date.now()
    if (
      now - lastImprovementTime > RESTART_STAGNATION_MS &&
      restartCount < maxRestarts
    ) {
      restartCount++

      // 最良解に復元
      for (let i = 0; i < assignments.length; i++) {
        assignments[i] = { ...bestAssignments[i] }
      }
      rebuildCtxMaps(ctx, assignments, komaLookup)

      // 摂動率をリスタート回数に応じて増加
      const perturbRatio = 0.1 + restartCount * 0.05
      perturbAssignments(
        ctx,
        assignments,
        komaLookup,
        allPositions,
        rng,
        perturbRatio
      )

      // インデックス再構築
      const newSlotIdx = buildSlotIndex(ctx, assignments)
      for (const k of Object.keys(slotIdx)) delete slotIdx[k]
      Object.assign(slotIdx, newSlotIdx)

      const newVi = buildViolationIndex(ctx, komaLookup, assignments)
      vi.costByIndex = newVi.costByIndex
      vi.violatingIndices = newVi.violatingIndices
      vi.totalScore = newVi.totalScore

      tabuList.length = 0
      tabuTenure = 15
      lastImprovementTime = now

      onProgress?.({
        phase: "localSearch",
        phaseLabel: "局所探索",
        score: bestScore,
        message: `リスタート ${restartCount}/${maxRestarts}回目 ｜ 最良スコア ${bestScore}`,
      })
    }

    // リスタート枠使い切り後もテニュア延長で探索継続
    if (restartCount >= maxRestarts && now - lastImprovementTime > 5000) {
      tabuTenure = Math.min(tabuTenure + 2, 60)
    }

    // 500msごとに進捗報告
    if (now - lastReportTime >= 500) {
      lastReportTime = now
      onProgress?.({
        phase: "localSearch",
        phaseLabel: "局所探索",
        placedCount: assignments.length,
        score: bestScore,
        violations: 0,
        message: `${iteration.toLocaleString()}手探索済み ｜ 探索中スコア ${vi.totalScore.toLocaleString()}`,
      })
    }
  }

  return bestAssignments
}

// ── 移動選択 ──

function selectAndApplyMove(
  ctx: ConstraintContext,
  assignments: Assignment[],
  komaLookup: KomaLookup,
  allPositions: SlotPosition[],
  slotIdx: SlotIndex,
  vi: ViolationIndex,
  tabuList: TabuEntry[],
  tabuTenure: number,
  iteration: number,
  bestGlobalScore: number,
  rng: SeededRandom,
  indicesForKoma: Map<string, number[]>
): boolean {
  const r = rng.next()

  if (r < 0.45) {
    return moveTargeted(
      ctx,
      assignments,
      komaLookup,
      allPositions,
      slotIdx,
      vi,
      tabuList,
      tabuTenure,
      iteration,
      bestGlobalScore,
      rng,
      indicesForKoma
    )
  } else if (r < 0.8) {
    return moveResourceSwap(
      ctx,
      assignments,
      komaLookup,
      slotIdx,
      vi,
      tabuList,
      tabuTenure,
      iteration,
      rng,
      indicesForKoma
    )
  } else if (r < 0.95) {
    return moveChainEjection(
      ctx,
      assignments,
      komaLookup,
      allPositions,
      slotIdx,
      vi,
      tabuList,
      tabuTenure,
      iteration,
      rng,
      indicesForKoma
    )
  } else {
    return moveRandom(
      ctx,
      assignments,
      komaLookup,
      allPositions,
      slotIdx,
      vi,
      tabuList,
      tabuTenure,
      iteration,
      rng,
      indicesForKoma
    )
  }
}

// ── 近傍1: 標的移動（45%）──
// 標準タブー探索: 最良非タブー手を常に選択（悪化も許容）

function moveTargeted(
  ctx: ConstraintContext,
  assignments: Assignment[],
  komaLookup: KomaLookup,
  allPositions: SlotPosition[],
  slotIdx: SlotIndex,
  vi: ViolationIndex,
  tabuList: TabuEntry[],
  tabuTenure: number,
  iteration: number,
  bestGlobalScore: number,
  rng: SeededRandom,
  indicesForKoma: Map<string, number[]>
): boolean {
  if (vi.violatingIndices.length === 0) return false

  const pickIdx = rng.nextInt(0, Math.min(4, vi.violatingIndices.length - 1))
  const assignIdx = vi.violatingIndices[pickIdx]
  const a = assignments[assignIdx]
  const oldPos: SlotPosition = { dayOfWeek: a.dayOfWeek, period: a.period }
  const komaId = a.komaId
  const oldCost = vi.costByIndex[assignIdx]

  // 最良手を追跡（悪化も含む）
  let bestPos: SlotPosition | null = null
  let bestNewCost = Infinity

  // 一時的にマップから除去して全スロットを評価
  removeFromMaps(ctx, komaLookup, komaId, oldPos, slotIdx)

  for (const pos of allPositions) {
    if (pos.dayOfWeek === oldPos.dayOfWeek && pos.period === oldPos.period)
      continue

    const sk = `${pos.dayOfWeek}:${pos.period}`
    const tabu = isTabu(tabuList, assignIdx, sk, iteration)
    const newCost = computeKomaPlacementCost(ctx, komaId, pos)

    if (tabu) {
      // アスピレーション: グローバル最良更新なら受理
      const tentativeTotal = vi.totalScore - oldCost + newCost
      if (tentativeTotal >= bestGlobalScore) continue
    }

    if (newCost < bestNewCost) {
      bestNewCost = newCost
      bestPos = pos
      if (newCost === 0) break // コスト0なら即決
    }
  }

  // マップ復元
  addToMaps(ctx, komaLookup, komaId, oldPos, slotIdx)

  if (!bestPos) return false

  // 移動実行（悪化でも実行 — タブーリストが循環を防止）
  applyMove(
    ctx,
    assignments,
    komaLookup,
    assignIdx,
    bestPos,
    slotIdx,
    vi,
    indicesForKoma
  )
  tabuList.push({
    assignmentIdx: assignIdx,
    slotKey: `${oldPos.dayOfWeek}:${oldPos.period}`,
    expiry: iteration + tabuTenure,
  })

  return bestNewCost < oldCost
}

// ── 近傍2: リソース交換（35%）──

function moveResourceSwap(
  ctx: ConstraintContext,
  assignments: Assignment[],
  komaLookup: KomaLookup,
  slotIdx: SlotIndex,
  vi: ViolationIndex,
  tabuList: TabuEntry[],
  tabuTenure: number,
  iteration: number,
  rng: SeededRandom,
  indicesForKoma: Map<string, number[]>
): boolean {
  if (vi.violatingIndices.length === 0) return false

  const pickIdx = rng.nextInt(0, Math.min(4, vi.violatingIndices.length - 1))
  const idxA = vi.violatingIndices[pickIdx]
  const aA = assignments[idxA]
  const koma = komaLookup[aA.komaId]
  if (!koma) return false

  // 同一リソース共有するコマの配列インデックスを収集
  const candidates: number[] = []
  for (const tid of koma.teacherIds) {
    const days = ctx.teacherMap[tid]
    if (!days) continue
    for (const dayMap of Object.values(days)) {
      for (const kid of Object.values(dayMap)) {
        if (kid && kid !== aA.komaId) {
          const idxList = indicesForKoma.get(kid)
          if (idxList) {
            for (const idx of idxList) {
              if (idx !== idxA) candidates.push(idx)
            }
          }
        }
      }
    }
  }

  if (candidates.length === 0) return false

  const idxB = rng.pick(candidates)
  const aB = assignments[idxB]

  if (aA.dayOfWeek === aB.dayOfWeek && aA.period === aB.period) return false

  // タブーチェック
  const skA = `${aB.dayOfWeek}:${aB.period}`
  const skB = `${aA.dayOfWeek}:${aA.period}`
  if (
    isTabu(tabuList, idxA, skA, iteration) ||
    isTabu(tabuList, idxB, skB, iteration)
  ) {
    return false
  }

  const scoreBefore = vi.totalScore

  // 交換実行
  applySwap(
    ctx,
    assignments,
    komaLookup,
    idxA,
    idxB,
    slotIdx,
    vi,
    indicesForKoma
  )

  if (vi.totalScore < scoreBefore) {
    tabuList.push({
      assignmentIdx: idxA,
      slotKey: skB,
      expiry: iteration + tabuTenure,
    })
    tabuList.push({
      assignmentIdx: idxB,
      slotKey: skA,
      expiry: iteration + tabuTenure,
    })
    return true
  }

  // 改善なし: 元に戻す
  applySwap(
    ctx,
    assignments,
    komaLookup,
    idxA,
    idxB,
    slotIdx,
    vi,
    indicesForKoma
  )
  return false
}

// ── 近傍3: 玉突き連鎖（15%）──

function moveChainEjection(
  ctx: ConstraintContext,
  assignments: Assignment[],
  komaLookup: KomaLookup,
  allPositions: SlotPosition[],
  slotIdx: SlotIndex,
  vi: ViolationIndex,
  tabuList: TabuEntry[],
  tabuTenure: number,
  iteration: number,
  rng: SeededRandom,
  indicesForKoma: Map<string, number[]>
): boolean {
  if (vi.violatingIndices.length === 0) return false

  const pickIdx = rng.nextInt(0, Math.min(4, vi.violatingIndices.length - 1))
  const idxA = vi.violatingIndices[pickIdx]
  const aA = assignments[idxA]
  const koma = komaLookup[aA.komaId]
  if (!koma) return false

  const targetPos = rng.pick(allPositions)
  if (targetPos.dayOfWeek === aA.dayOfWeek && targetPos.period === aA.period)
    return false

  // 移動先にいるコマを特定
  let ejectedIdx: number | null = null
  for (const cid of koma.classIds) {
    const existing =
      ctx.classMap[cid]?.[targetPos.dayOfWeek]?.[targetPos.period]
    if (existing && existing !== aA.komaId) {
      const idxList = indicesForKoma.get(existing)
      if (idxList) {
        for (const idx of idxList) {
          if (
            assignments[idx].dayOfWeek === targetPos.dayOfWeek &&
            assignments[idx].period === targetPos.period
          ) {
            ejectedIdx = idx
            break
          }
        }
      }
      break
    }
  }

  if (ejectedIdx === null) {
    // 空きスロット: 通常移動
    const scoreBefore = vi.totalScore
    const origPos: SlotPosition = { dayOfWeek: aA.dayOfWeek, period: aA.period }
    applyMove(
      ctx,
      assignments,
      komaLookup,
      idxA,
      targetPos,
      slotIdx,
      vi,
      indicesForKoma
    )
    if (vi.totalScore < scoreBefore) {
      tabuList.push({
        assignmentIdx: idxA,
        slotKey: `${origPos.dayOfWeek}:${origPos.period}`,
        expiry: iteration + tabuTenure,
      })
      return true
    }
    // 元に戻す
    applyMove(
      ctx,
      assignments,
      komaLookup,
      idxA,
      origPos,
      slotIdx,
      vi,
      indicesForKoma
    )
    return false
  }

  // 玉突き: Aをtargetに、ejectedをAの元位置に
  const aB = assignments[ejectedIdx]
  const oldPosA: SlotPosition = { dayOfWeek: aA.dayOfWeek, period: aA.period }
  const oldPosB: SlotPosition = { dayOfWeek: aB.dayOfWeek, period: aB.period }
  const scoreBefore = vi.totalScore

  // 影響範囲計算（移動前）
  const aff1 = getAffectedIndices(
    ctx,
    komaLookup,
    aA.komaId,
    oldPosA,
    slotIdx,
    indicesForKoma
  )
  const aff2 = getAffectedIndices(
    ctx,
    komaLookup,
    aB.komaId,
    oldPosB,
    slotIdx,
    indicesForKoma
  )

  // 両方除去
  removeFromMaps(ctx, komaLookup, aA.komaId, oldPosA, slotIdx)
  removeFromMaps(ctx, komaLookup, aB.komaId, oldPosB, slotIdx)

  // 新位置に配置
  assignments[idxA] = {
    komaId: aA.komaId,
    dayOfWeek: targetPos.dayOfWeek,
    period: targetPos.period,
  }
  assignments[ejectedIdx] = {
    komaId: aB.komaId,
    dayOfWeek: oldPosA.dayOfWeek,
    period: oldPosA.period,
  }

  addToMaps(ctx, komaLookup, aA.komaId, targetPos, slotIdx)
  addToMaps(ctx, komaLookup, aB.komaId, oldPosA, slotIdx)

  // 影響範囲計算（移動後）
  const aff3 = getAffectedIndices(
    ctx,
    komaLookup,
    aA.komaId,
    targetPos,
    slotIdx,
    indicesForKoma
  )
  const aff4 = getAffectedIndices(
    ctx,
    komaLookup,
    aB.komaId,
    oldPosA,
    slotIdx,
    indicesForKoma
  )
  const allAff = new Set([...aff1, ...aff2, ...aff3, ...aff4])
  updateViolationIndex(vi, allAff, ctx, komaLookup, assignments)

  if (vi.totalScore < scoreBefore) {
    tabuList.push({
      assignmentIdx: idxA,
      slotKey: `${oldPosA.dayOfWeek}:${oldPosA.period}`,
      expiry: iteration + tabuTenure,
    })
    tabuList.push({
      assignmentIdx: ejectedIdx,
      slotKey: `${oldPosB.dayOfWeek}:${oldPosB.period}`,
      expiry: iteration + tabuTenure,
    })
    return true
  }

  // 元に戻す
  removeFromMaps(ctx, komaLookup, aA.komaId, targetPos, slotIdx)
  removeFromMaps(ctx, komaLookup, aB.komaId, oldPosA, slotIdx)
  assignments[idxA] = {
    komaId: aA.komaId,
    dayOfWeek: oldPosA.dayOfWeek,
    period: oldPosA.period,
  }
  assignments[ejectedIdx] = {
    komaId: aB.komaId,
    dayOfWeek: oldPosB.dayOfWeek,
    period: oldPosB.period,
  }
  addToMaps(ctx, komaLookup, aA.komaId, oldPosA, slotIdx)
  addToMaps(ctx, komaLookup, aB.komaId, oldPosB, slotIdx)
  updateViolationIndex(vi, allAff, ctx, komaLookup, assignments)

  return false
}

// ── 近傍4: ランダム摂動（5%）──

function moveRandom(
  ctx: ConstraintContext,
  assignments: Assignment[],
  komaLookup: KomaLookup,
  allPositions: SlotPosition[],
  slotIdx: SlotIndex,
  vi: ViolationIndex,
  tabuList: TabuEntry[],
  tabuTenure: number,
  iteration: number,
  rng: SeededRandom,
  indicesForKoma: Map<string, number[]>
): boolean {
  if (assignments.length === 0) return false

  const assignIdx = rng.nextInt(0, assignments.length - 1)
  const a = assignments[assignIdx]
  const oldPos: SlotPosition = { dayOfWeek: a.dayOfWeek, period: a.period }
  const newPos = rng.pick(allPositions)
  if (newPos.dayOfWeek === oldPos.dayOfWeek && newPos.period === oldPos.period)
    return false

  const scoreBefore = vi.totalScore
  applyMove(
    ctx,
    assignments,
    komaLookup,
    assignIdx,
    newPos,
    slotIdx,
    vi,
    indicesForKoma
  )

  tabuList.push({
    assignmentIdx: assignIdx,
    slotKey: `${oldPos.dayOfWeek}:${oldPos.period}`,
    expiry: iteration + tabuTenure,
  })

  return vi.totalScore < scoreBefore
}

// ── ヘルパー ──

function applyMove(
  ctx: ConstraintContext,
  assignments: Assignment[],
  komaLookup: KomaLookup,
  idx: number,
  newPos: SlotPosition,
  slotIdx: SlotIndex,
  vi: ViolationIndex,
  indicesForKoma: Map<string, number[]>
): void {
  const a = assignments[idx]
  const oldPos: SlotPosition = { dayOfWeek: a.dayOfWeek, period: a.period }

  const affBefore = getAffectedIndices(
    ctx,
    komaLookup,
    a.komaId,
    oldPos,
    slotIdx,
    indicesForKoma
  )

  removeFromMaps(ctx, komaLookup, a.komaId, oldPos, slotIdx)
  assignments[idx] = {
    komaId: a.komaId,
    dayOfWeek: newPos.dayOfWeek,
    period: newPos.period,
  }
  addToMaps(ctx, komaLookup, a.komaId, newPos, slotIdx)

  const affAfter = getAffectedIndices(
    ctx,
    komaLookup,
    a.komaId,
    newPos,
    slotIdx,
    indicesForKoma
  )
  const allAff = new Set([...affBefore, ...affAfter])
  updateViolationIndex(vi, allAff, ctx, komaLookup, assignments)
}

function applySwap(
  ctx: ConstraintContext,
  assignments: Assignment[],
  komaLookup: KomaLookup,
  idxA: number,
  idxB: number,
  slotIdx: SlotIndex,
  vi: ViolationIndex,
  indicesForKoma: Map<string, number[]>
): void {
  const aA = assignments[idxA]
  const aB = assignments[idxB]
  const posA: SlotPosition = { dayOfWeek: aA.dayOfWeek, period: aA.period }
  const posB: SlotPosition = { dayOfWeek: aB.dayOfWeek, period: aB.period }

  const affA = getAffectedIndices(
    ctx,
    komaLookup,
    aA.komaId,
    posA,
    slotIdx,
    indicesForKoma
  )
  const affB = getAffectedIndices(
    ctx,
    komaLookup,
    aB.komaId,
    posB,
    slotIdx,
    indicesForKoma
  )

  removeFromMaps(ctx, komaLookup, aA.komaId, posA, slotIdx)
  removeFromMaps(ctx, komaLookup, aB.komaId, posB, slotIdx)

  assignments[idxA] = {
    komaId: aA.komaId,
    dayOfWeek: posB.dayOfWeek,
    period: posB.period,
  }
  assignments[idxB] = {
    komaId: aB.komaId,
    dayOfWeek: posA.dayOfWeek,
    period: posA.period,
  }

  addToMaps(ctx, komaLookup, aA.komaId, posB, slotIdx)
  addToMaps(ctx, komaLookup, aB.komaId, posA, slotIdx)

  const affA2 = getAffectedIndices(
    ctx,
    komaLookup,
    aA.komaId,
    posB,
    slotIdx,
    indicesForKoma
  )
  const affB2 = getAffectedIndices(
    ctx,
    komaLookup,
    aB.komaId,
    posA,
    slotIdx,
    indicesForKoma
  )
  const allAff = new Set([...affA, ...affB, ...affA2, ...affB2])
  updateViolationIndex(vi, allAff, ctx, komaLookup, assignments)
}

function isTabu(
  tabuList: TabuEntry[],
  assignmentIdx: number,
  slotKey: string,
  iteration: number
): boolean {
  return tabuList.some(
    (e) =>
      e.assignmentIdx === assignmentIdx &&
      e.slotKey === slotKey &&
      e.expiry > iteration
  )
}

function pruneTabuList(tabuList: TabuEntry[], iteration: number): void {
  if (iteration % 100 === 0) {
    let writeIdx = 0
    for (let i = 0; i < tabuList.length; i++) {
      if (tabuList[i].expiry > iteration) {
        tabuList[writeIdx] = tabuList[i]
        writeIdx++
      }
    }
    tabuList.length = writeIdx
  }
}

function buildIndicesForKoma(assignments: Assignment[]): Map<string, number[]> {
  const map = new Map<string, number[]>()
  for (let i = 0; i < assignments.length; i++) {
    const kid = assignments[i].komaId
    if (!map.has(kid)) map.set(kid, [])
    map.get(kid)!.push(i)
  }
  return map
}

function rebuildCtxMaps(
  ctx: ConstraintContext,
  assignments: Assignment[],
  komaLookup: KomaLookup
): void {
  for (const k of Object.keys(ctx.teacherMap)) delete ctx.teacherMap[k]
  for (const k of Object.keys(ctx.classMap)) delete ctx.classMap[k]
  for (const k of Object.keys(ctx.roomMap)) delete ctx.roomMap[k]
  if (ctx.komaSlotCount) {
    for (const k of Object.keys(ctx.komaSlotCount)) delete ctx.komaSlotCount[k]
  }

  const { teacherMap, classMap, roomMap, komaSlotCount } = buildScheduleMaps(
    assignments,
    komaLookup
  )
  Object.assign(ctx.teacherMap, teacherMap)
  Object.assign(ctx.classMap, classMap)
  Object.assign(ctx.roomMap, roomMap)
  Object.assign(ctx.komaSlotCount, komaSlotCount)
}

function perturbAssignments(
  ctx: ConstraintContext,
  assignments: Assignment[],
  komaLookup: KomaLookup,
  allPositions: SlotPosition[],
  rng: SeededRandom,
  ratio: number
): void {
  const count = Math.max(1, Math.floor(assignments.length * ratio))
  for (let i = 0; i < count; i++) {
    const idx = rng.nextInt(0, assignments.length - 1)
    const a = assignments[idx]
    const oldPos: SlotPosition = { dayOfWeek: a.dayOfWeek, period: a.period }
    const newPos = rng.pick(allPositions)

    removeFromMaps(ctx, komaLookup, a.komaId, oldPos)
    assignments[idx] = {
      komaId: a.komaId,
      dayOfWeek: newPos.dayOfWeek,
      period: newPos.period,
    }
    addToMaps(ctx, komaLookup, a.komaId, newPos)
  }
}
