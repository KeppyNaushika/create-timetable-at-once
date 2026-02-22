import type { ConstraintContext } from "./constraints"
import {
  evaluateAllConstraints,
  calculateScore,
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
  onProgress?: (progress: Partial<SolverProgress>) => void
): Assignment[] {
  const rng = new SeededRandom(config.seed)
  let current = [...initialAssignments]
  let currentScore = calculateScore(evaluateAllConstraints(ctx, current))
  let bestAssignments = [...current]
  let bestScore = currentScore

  let temp = config.saInitialTemp
  let iteration = 0

  for (let restart = 0; restart < config.ilsRestarts; restart++) {
    temp = config.saInitialTemp

    for (let i = 0; i < config.saIterations; i++) {
      iteration++

      if (iteration % 1000 === 0) {
        onProgress?.({
          phase: "annealing",
          phaseLabel: "焼きなまし法",
          score: bestScore,
          violations: evaluateAllConstraints(ctx, bestAssignments).length,
          message: `SA: iter=${iteration}, temp=${temp.toFixed(1)}, score=${currentScore}`,
        })
      }

      if (currentScore === 0) break // Perfect solution

      // Generate neighbor
      const neighbor = generateNeighbor(
        ctx,
        current,
        komaLookup,
        allPositions,
        rng
      )
      if (!neighbor) continue

      const neighborScore = calculateScore(
        evaluateAllConstraints(ctx, neighbor)
      )
      const delta = neighborScore - currentScore

      // Accept if better or by probability
      if (delta < 0 || rng.next() < Math.exp(-delta / temp)) {
        current = neighbor
        currentScore = neighborScore

        if (currentScore < bestScore) {
          bestAssignments = [...current]
          bestScore = currentScore
        }
      }

      temp *= config.saCoolingRate
    }

    if (bestScore === 0) break

    // ILS perturbation: restart from best with random perturbation
    current = perturbSolution(
      bestAssignments,
      komaLookup,
      allPositions,
      rng,
      ctx
    )
    currentScore = calculateScore(evaluateAllConstraints(ctx, current))
  }

  return bestAssignments
}

function generateNeighbor(
  ctx: ConstraintContext,
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
      return neighborMove(assignments, allPositions, rng, ctx, komaLookup)
    case 2:
      return neighborBlockMove(assignments, rng, ctx, komaLookup)
    default:
      return null
  }
}

// Swap: exchange positions of two random assignments
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

// Move: move one random assignment to a random valid position
function neighborMove(
  assignments: Assignment[],
  allPositions: SlotPosition[],
  rng: SeededRandom,
  ctx: ConstraintContext,
  komaLookup: KomaLookup
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

// Block move: move all assignments on a day-period pair to another
function neighborBlockMove(
  assignments: Assignment[],
  rng: SeededRandom,
  ctx: ConstraintContext,
  komaLookup: KomaLookup
): Assignment[] | null {
  if (assignments.length === 0) return null

  const source = rng.pick(assignments)
  const targetDay = rng.nextInt(0, 5)
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
  komaLookup: KomaLookup,
  allPositions: SlotPosition[],
  rng: SeededRandom,
  ctx: ConstraintContext
): Assignment[] {
  let result = [...assignments]
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
