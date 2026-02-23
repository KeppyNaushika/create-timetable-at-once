import type { ConstraintContext } from "./constraints"
import { computeKomaPlacementCost } from "./constraints"
import { addToMaps } from "./incrementalMaps"
import type { SeededRandom } from "./random"
import type {
  Assignment,
  KomaLookup,
  SlotPosition,
  SolverProgress,
} from "./types"

interface GreedyTarget {
  komaId: string
  index: number
}

/**
 * 貪欲構築: 全コマを最小コストのスロットに配置する。
 * ctx のスケジュールマップはfixedAssignments反映済みであること。
 * 配置するたびに ctx マップをインクリメンタル更新する。
 */
export function greedyConstruct(
  ctx: ConstraintContext,
  komaLookup: KomaLookup,
  allPositions: SlotPosition[],
  fixedAssignments: Assignment[],
  targets: GreedyTarget[],
  rng: SeededRandom,
  onProgress?: (p: Partial<SolverProgress>) => void
): Assignment[] {
  const result: Assignment[] = [...fixedAssignments]

  // 既に固定配置されたコマを除外
  const fixedSet = new Set<string>()
  for (const a of fixedAssignments) {
    fixedSet.add(`${a.komaId}#${a.dayOfWeek}#${a.period}`)
  }

  // 配置済み数をコマIDごとにカウント
  const placedCount: Record<string, number> = {}
  for (const a of fixedAssignments) {
    placedCount[a.komaId] = (placedCount[a.komaId] ?? 0) + 1
  }

  // 必要数をコマIDごとに集計
  const requiredCount: Record<string, number> = {}
  for (const t of targets) {
    requiredCount[t.komaId] = Math.max(requiredCount[t.komaId] ?? 0, t.index + 1)
  }

  // 未配置ターゲットを構築
  const unplacedTargets: GreedyTarget[] = []
  for (const [komaId, required] of Object.entries(requiredCount)) {
    const placed = placedCount[komaId] ?? 0
    for (let i = 0; i < required - placed; i++) {
      unplacedTargets.push({ komaId, index: placed + i })
    }
  }

  // 難易度ソート + ラウンドロビン
  const ordered = orderTargets(unplacedTargets, komaLookup, ctx, allPositions)

  let totalPlaced = fixedAssignments.length
  const totalTargets = targets.length

  // 連続コマの処理済みフラグ
  const consecutivePlaced = new Set<string>()

  for (const target of ordered) {
    const { komaId } = target
    const koma = komaLookup[komaId]
    if (!koma) continue

    // 連続コマ: ペアで配置
    if (koma.type === "consecutive" && !consecutivePlaced.has(komaId)) {
      consecutivePlaced.add(komaId)
      const pairCount = (requiredCount[komaId] ?? 0) - (placedCount[komaId] ?? 0)
      if (pairCount >= 2) {
        const pair = placeConsecutivePair(ctx, komaLookup, komaId, allPositions)
        if (pair) {
          result.push(pair[0], pair[1])
          totalPlaced += 2
        }
        reportProgress(onProgress, totalPlaced, totalTargets)
        continue
      }
    }

    if (koma.type === "consecutive" && consecutivePlaced.has(komaId)) {
      continue // ペア処理で配置済み
    }

    // 通常コマ: 全スロットのコストを評価し最小コストに配置
    let bestPos: SlotPosition | null = null
    let bestCost = Infinity

    for (const pos of allPositions) {
      const cost = computeKomaPlacementCost(ctx, komaId, pos)
      if (cost < bestCost) {
        bestCost = cost
        bestPos = pos
        if (cost === 0) break
      }
    }

    if (bestPos) {
      const assignment: Assignment = {
        komaId,
        dayOfWeek: bestPos.dayOfWeek,
        period: bestPos.period,
      }
      result.push(assignment)
      addToMaps(ctx, komaLookup, komaId, bestPos)
      totalPlaced++
    }

    reportProgress(onProgress, totalPlaced, totalTargets)
  }

  onProgress?.({
    phase: "construction",
    phaseLabel: "貪欲構築完了",
    placedCount: totalPlaced,
    totalKomas: totalTargets,
    message: `構築完了: ${totalPlaced}/${totalTargets}コマ配置`,
  })

  return result
}

function reportProgress(
  onProgress: ((p: Partial<SolverProgress>) => void) | undefined,
  placed: number,
  total: number
): void {
  if (onProgress && placed % 20 === 0) {
    onProgress({
      phase: "construction",
      phaseLabel: "貪欲構築",
      placedCount: placed,
      totalKomas: total,
      message: `構築: ${placed}/${total}コマ配置済み`,
    })
  }
}

function placeConsecutivePair(
  ctx: ConstraintContext,
  komaLookup: KomaLookup,
  komaId: string,
  allPositions: SlotPosition[]
): [Assignment, Assignment] | null {
  let bestCost = Infinity
  let bestPair: [SlotPosition, SlotPosition] | null = null

  // 日ごとの時限を集約
  const periodsByDay = new Map<number, number[]>()
  for (const pos of allPositions) {
    if (!periodsByDay.has(pos.dayOfWeek)) periodsByDay.set(pos.dayOfWeek, [])
    periodsByDay.get(pos.dayOfWeek)!.push(pos.period)
  }

  for (const [day, periods] of periodsByDay) {
    const sorted = periods.sort((a, b) => a - b)
    for (let i = 0; i < sorted.length - 1; i++) {
      const p1 = sorted[i]
      const p2 = sorted[i + 1]
      if (p2 !== p1 + 1) continue

      // 昼休みまたぎ回避
      if (ctx.lunchAfterPeriod > 0 && p1 === ctx.lunchAfterPeriod) continue

      const pos1: SlotPosition = { dayOfWeek: day, period: p1 }
      const pos2: SlotPosition = { dayOfWeek: day, period: p2 }

      // コマはまだマップにないので computeKomaPlacementCost がそのまま使える
      const cost1 = computeKomaPlacementCost(ctx, komaId, pos1)
      const cost2 = computeKomaPlacementCost(ctx, komaId, pos2)
      const totalCost = cost1 + cost2

      if (totalCost < bestCost) {
        bestCost = totalCost
        bestPair = [pos1, pos2]
        if (totalCost === 0) break
      }
    }
    if (bestCost === 0) break
  }

  if (!bestPair) return null

  // 配置してマップ更新
  addToMaps(ctx, komaLookup, komaId, bestPair[0])
  addToMaps(ctx, komaLookup, komaId, bestPair[1])

  return [
    { komaId, dayOfWeek: bestPair[0].dayOfWeek, period: bestPair[0].period },
    { komaId, dayOfWeek: bestPair[1].dayOfWeek, period: bestPair[1].period },
  ]
}

function orderTargets(
  targets: GreedyTarget[],
  komaLookup: KomaLookup,
  ctx: ConstraintContext,
  allPositions: SlotPosition[]
): GreedyTarget[] {
  // 難易度スコア計算
  const difficultyMap = new Map<string, number>()

  for (const t of targets) {
    if (difficultyMap.has(t.komaId)) continue
    const koma = komaLookup[t.komaId]
    if (!koma) {
      difficultyMap.set(t.komaId, 0)
      continue
    }

    let difficulty = 0

    for (const tid of koma.teacherIds) {
      let availCount = 0
      for (const pos of allPositions) {
        const status = ctx.teacherAvailMap[tid]?.[pos.dayOfWeek]?.[pos.period]
        if (status !== "unavailable") availCount++
      }
      difficulty += (allPositions.length - availCount) * 10
    }

    if (koma.roomIds.length > 0) difficulty += 50
    if (koma.type === "consecutive") difficulty += 100

    difficultyMap.set(t.komaId, difficulty)
  }

  // クラスIDでグループ化
  const byClass = new Map<string, GreedyTarget[]>()
  for (const t of targets) {
    const koma = komaLookup[t.komaId]
    const classId = koma?.classIds[0] ?? "__none__"
    if (!byClass.has(classId)) byClass.set(classId, [])
    byClass.get(classId)!.push(t)
  }

  // 各グループ内を難易度降順ソート
  for (const group of byClass.values()) {
    group.sort(
      (a, b) =>
        (difficultyMap.get(b.komaId) ?? 0) - (difficultyMap.get(a.komaId) ?? 0)
    )
  }

  // クラス間をラウンドロビンで交互配置
  const classGroups = [...byClass.values()]
  const result: GreedyTarget[] = []
  const indices = new Array(classGroups.length).fill(0)
  let remaining = targets.length

  while (remaining > 0) {
    for (let g = 0; g < classGroups.length; g++) {
      if (indices[g] < classGroups[g].length) {
        result.push(classGroups[g][indices[g]])
        indices[g]++
        remaining--
      }
    }
  }

  return result
}
