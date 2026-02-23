import type { ConstraintContext } from "./constraints"
import {
  calculateScoreFast,
  isPlacementValid,
} from "./constraints"
import { SeededRandom } from "./random"
import type {
  Assignment,
  KomaLookup,
  SlotPosition,
  SolverConfig,
  SolverProgress,
} from "./types"

// Simulated Annealing + Iterated Local Search
export function simulatedAnnealing(
  ctx: ConstraintContext,
  initialAssignments: Assignment[],
  komaLookup: KomaLookup,
  allPositions: SlotPosition[],
  config: SolverConfig,
  onProgress?: (progress: Partial<SolverProgress>) => void,
  targets?: { komaId: string; index: number }[],
  deadlineMs?: number
): Assignment[] {
  const rng = new SeededRandom(config.seed)
  const startTime = Date.now()
  const timeLimit = deadlineMs ?? config.maxTimeMs

  // Phase 0: 未配置ターゲットを貪欲に追加
  let current = [...initialAssignments]
  if (targets && targets.length > 0) {
    current = greedyFillMissing(ctx, current, komaLookup, allPositions, targets, rng)
  }

  // 現在のスケジュールマップを構築（以降インクリメンタルに更新）
  let currentMaps = buildMaps(current, komaLookup)
  let saCtx: ConstraintContext = { ...ctx, ...currentMaps }
  let currentScore = calculateScoreFast(saCtx, current)

  let bestAssignments = [...current]
  let bestScore = currentScore

  let temp = config.saInitialTemp
  let iteration = 0
  let accepted = 0

  for (let restart = 0; restart < config.ilsRestarts; restart++) {
    temp = config.saInitialTemp

    for (let i = 0; i < config.saIterations; i++) {
      iteration++

      // タイムアウトチェック（500イテレーションごと）
      if (iteration % 500 === 0) {
        if (Date.now() - startTime > timeLimit) break

        if (iteration % 2000 === 0) {
          onProgress?.({
            phase: "annealing",
            phaseLabel: "焼きなまし法",
            placedCount: bestAssignments.length,
            score: bestScore,
            violations: bestScore,
            message: `SA: iter=${iteration}, accepted=${accepted}, temp=${temp.toFixed(1)}, best=${bestScore}`,
          })
        }
      }

      if (currentScore === 0) break

      // Generate neighbor + evaluate with rebuilt maps
      const neighbor = generateNeighbor(current, komaLookup, allPositions, rng)
      if (!neighbor) continue

      const neighborMaps = buildMaps(neighbor, komaLookup)
      const neighborCtx: ConstraintContext = { ...ctx, ...neighborMaps }
      const neighborScore = calculateScoreFast(neighborCtx, neighbor)
      const delta = neighborScore - currentScore

      // Accept if better or by probability
      if (delta < 0 || rng.next() < Math.exp(-delta / temp)) {
        current = neighbor
        currentMaps = neighborMaps
        saCtx = neighborCtx
        currentScore = neighborScore
        accepted++

        if (currentScore < bestScore) {
          bestAssignments = [...current]
          bestScore = currentScore
        }
      }

      temp *= config.saCoolingRate
    }

    if (bestScore === 0) break
    if (Date.now() - startTime > timeLimit) break

    // ILS perturbation: restart from best with random perturbation
    current = perturbSolution(bestAssignments, allPositions, rng)
    currentMaps = buildMaps(current, komaLookup)
    saCtx = { ...ctx, ...currentMaps }
    currentScore = calculateScoreFast(saCtx, current)
  }

  return bestAssignments
}

// ── スケジュールマップ構築 ──────────────────────────

function buildMaps(assignments: Assignment[], komaLookup: KomaLookup) {
  const teacherMap: Record<string, Record<number, Record<number, string | null>>> = {}
  const classMap: Record<string, Record<number, Record<number, string | null>>> = {}
  const roomMap: Record<string, Record<number, Record<number, string | null>>> = {}

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
  }

  return { teacherMap, classMap, roomMap }
}

// ── Greedy Fill ────────────────────────────────────

function greedyFillMissing(
  ctx: ConstraintContext,
  assignments: Assignment[],
  komaLookup: KomaLookup,
  allPositions: SlotPosition[],
  targets: { komaId: string; index: number }[],
  rng: SeededRandom
): Assignment[] {
  const result = [...assignments]

  const placedCount: Record<string, number> = {}
  for (const a of result) {
    placedCount[a.komaId] = (placedCount[a.komaId] ?? 0) + 1
  }

  const requiredCount: Record<string, number> = {}
  for (const t of targets) {
    requiredCount[t.komaId] = Math.max(requiredCount[t.komaId] ?? 0, t.index + 1)
  }

  const missing: string[] = []
  for (const [komaId, required] of Object.entries(requiredCount)) {
    const placed = placedCount[komaId] ?? 0
    for (let i = 0; i < required - placed; i++) {
      missing.push(komaId)
    }
  }

  if (missing.length === 0) return result

  // シャッフル
  for (let i = missing.length - 1; i > 0; i--) {
    const j = rng.nextInt(0, i)
    ;[missing[i], missing[j]] = [missing[j], missing[i]]
  }

  const maps = buildMaps(result, komaLookup)
  const tempCtx: ConstraintContext = { ...ctx, ...maps }

  const shuffledPositions = [...allPositions]
  for (let i = shuffledPositions.length - 1; i > 0; i--) {
    const j = rng.nextInt(0, i)
    ;[shuffledPositions[i], shuffledPositions[j]] = [shuffledPositions[j], shuffledPositions[i]]
  }

  for (const komaId of missing) {
    for (const pos of shuffledPositions) {
      if (isPlacementValid(tempCtx, komaId, pos)) {
        result.push({ komaId, dayOfWeek: pos.dayOfWeek, period: pos.period })

        const koma = komaLookup[komaId]
        if (koma) {
          for (const tid of koma.teacherIds) {
            if (!tempCtx.teacherMap[tid]) tempCtx.teacherMap[tid] = {}
            if (!tempCtx.teacherMap[tid][pos.dayOfWeek]) tempCtx.teacherMap[tid][pos.dayOfWeek] = {}
            tempCtx.teacherMap[tid][pos.dayOfWeek][pos.period] = komaId
          }
          for (const cid of koma.classIds) {
            if (!tempCtx.classMap[cid]) tempCtx.classMap[cid] = {}
            if (!tempCtx.classMap[cid][pos.dayOfWeek]) tempCtx.classMap[cid][pos.dayOfWeek] = {}
            tempCtx.classMap[cid][pos.dayOfWeek][pos.period] = komaId
          }
          for (const rid of koma.roomIds) {
            if (!tempCtx.roomMap[rid]) tempCtx.roomMap[rid] = {}
            if (!tempCtx.roomMap[rid][pos.dayOfWeek]) tempCtx.roomMap[rid][pos.dayOfWeek] = {}
            tempCtx.roomMap[rid][pos.dayOfWeek][pos.period] = komaId
          }
        }
        break
      }
    }
  }

  return result
}

// ── 近傍生成 ──────────────────────────────────────

function generateNeighbor(
  assignments: Assignment[],
  komaLookup: KomaLookup,
  allPositions: SlotPosition[],
  rng: SeededRandom
): Assignment[] | null {
  if (assignments.length < 2) return null

  const op = rng.nextInt(0, 2)

  switch (op) {
    case 0:
      return neighborSwap(assignments, rng)
    case 1:
      return neighborMove(assignments, allPositions, rng)
    case 2:
      return neighborBlockMove(assignments, rng)
    default:
      return null
  }
}

function neighborSwap(
  assignments: Assignment[],
  rng: SeededRandom
): Assignment[] | null {
  if (assignments.length < 2) return null

  const i = rng.nextInt(0, assignments.length - 1)
  let j = rng.nextInt(0, assignments.length - 1)
  if (i === j) j = (j + 1) % assignments.length

  const result = [...assignments]
  result[i] = {
    ...result[i],
    dayOfWeek: assignments[j].dayOfWeek,
    period: assignments[j].period,
  }
  result[j] = {
    ...result[j],
    dayOfWeek: assignments[i].dayOfWeek,
    period: assignments[i].period,
  }
  return result
}

function neighborMove(
  assignments: Assignment[],
  allPositions: SlotPosition[],
  rng: SeededRandom
): Assignment[] | null {
  const idx = rng.nextInt(0, assignments.length - 1)
  const newPos = rng.pick(allPositions)

  const result = [...assignments]
  result[idx] = {
    ...result[idx],
    dayOfWeek: newPos.dayOfWeek,
    period: newPos.period,
  }
  return result
}

function neighborBlockMove(
  assignments: Assignment[],
  rng: SeededRandom
): Assignment[] | null {
  if (assignments.length === 0) return null

  const source = rng.pick(assignments)
  const targetDay = rng.nextInt(0, 4)
  const targetPeriod = rng.nextInt(1, 6)

  if (targetDay === source.dayOfWeek && targetPeriod === source.period)
    return null

  const result = assignments.map((a) => {
    if (a.dayOfWeek === source.dayOfWeek && a.period === source.period) {
      return { ...a, dayOfWeek: targetDay, period: targetPeriod }
    }
    return a
  })

  return result
}

function perturbSolution(
  assignments: Assignment[],
  allPositions: SlotPosition[],
  rng: SeededRandom
): Assignment[] {
  const result = [...assignments]
  const perturbCount = Math.max(1, Math.floor(result.length * 0.1))

  for (let i = 0; i < perturbCount; i++) {
    const idx = rng.nextInt(0, result.length - 1)
    const newPos = rng.pick(allPositions)
    result[idx] = {
      ...result[idx],
      dayOfWeek: newPos.dayOfWeek,
      period: newPos.period,
    }
  }

  return result
}
