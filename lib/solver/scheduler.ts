import type { ConstraintContext } from "./constraints"
import {
  evaluateAllConstraints,
  calculateScore,
  setTeacherCache,
} from "./constraints"
import { computeInitialDomains, ac3 } from "./domain"
import { backtrack } from "./backtrack"
import { simulatedAnnealing } from "./simulatedAnnealing"
import {
  buildKomaLookup,
  buildTeacherAvailabilityMap,
  buildRoomAvailabilityMap,
  buildDutyMap,
  buildScheduleMaps,
  getAllSlotPositions,
  expandKomasToAssignmentTargets,
} from "./utils"
import type {
  Assignment,
  SolverConfig,
  SolverInput,
  SolverProgress,
  SolverResult,
  DEFAULT_SOLVER_CONFIG,
} from "./types"

export class TimetableScheduler {
  private input: SolverInput
  private config: SolverConfig
  private startTime: number = 0

  constructor(input: SolverInput, config: SolverConfig) {
    this.input = input
    this.config = config
  }

  async *solve(): AsyncGenerator<SolverProgress, SolverResult> {
    this.startTime = Date.now()
    const results: SolverResult[] = []

    for (let pi = 0; pi < this.config.maxPatterns; pi++) {
      yield this.progress("propagation", "制約伝播", pi)

      const result = await this.solveOne(pi, (p) => {
        // Can't yield from callback, store for next iteration
      })

      results.push(result)

      yield {
        phase: "done",
        phaseLabel: "完了",
        patternIndex: pi,
        totalPatterns: this.config.maxPatterns,
        placedCount: result.assignments.length,
        totalKomas: this.getTotalKomas(),
        violations: result.violations.length,
        score: result.score,
        elapsedMs: Date.now() - this.startTime,
      }
    }

    // Return best result
    results.sort((a, b) => a.score - b.score)
    return results[0]
  }

  private async solveOne(
    patternIndex: number,
    onProgress: (p: SolverProgress) => void
  ): Promise<SolverResult> {
    const komaLookup = buildKomaLookup(this.input.komas)
    const teacherAvailMap = buildTeacherAvailabilityMap(this.input.teachers)
    const roomAvailMap = buildRoomAvailabilityMap(this.input.rooms)
    const dutyMap = buildDutyMap(this.input.duties)
    const allPositions = getAllSlotPositions(this.input)

    // Set teacher cache for constraint checks
    setTeacherCache(this.input.teachers)

    // Build initial assignments from fixed slots
    const fixedAssignments: Assignment[] = this.input.fixedSlots.map((s) => ({
      komaId: s.komaId,
      dayOfWeek: s.dayOfWeek,
      period: s.period,
    }))

    const { teacherMap, classMap, roomMap } = buildScheduleMaps(
      fixedAssignments,
      komaLookup
    )

    const ctx: ConstraintContext = {
      condition: this.input.condition,
      perSubjectConditions: this.input.condition.perSubjectConditions ?? [],
      komaLookup,
      teacherAvailMap,
      roomAvailMap,
      dutyMap,
      teacherMap,
      classMap,
      roomMap,
      maxPeriodsPerDay: this.input.school.maxPeriodsPerDay,
      lunchAfterPeriod: this.input.school.lunchAfterPeriod,
    }

    // Phase 1: Compute domains + AC-3
    const komaIds = Object.keys(komaLookup)
    const initialDomains = computeInitialDomains(komaIds, allPositions, ctx)
    const { consistent, domain } = ac3(initialDomains, komaLookup, ctx)

    if (!consistent) {
      return {
        assignments: fixedAssignments,
        violations: evaluateAllConstraints(ctx, fixedAssignments),
        score: Infinity,
        elapsedMs: Date.now() - this.startTime,
        isComplete: false,
      }
    }

    // Phase 2: Backtracking
    const targets = expandKomasToAssignmentTargets(this.input.komas)
    const btResult = backtrack(
      ctx,
      domain,
      komaLookup,
      fixedAssignments,
      targets,
      this.config.btMaxDepth
    )

    let assignments = btResult.assignments

    // Phase 3: Simulated Annealing (if BT didn't find complete solution)
    if (
      !btResult.complete ||
      calculateScore(evaluateAllConstraints(ctx, assignments)) > 0
    ) {
      // Rebuild schedule maps with BT result
      const {
        teacherMap: tm,
        classMap: cm,
        roomMap: rm,
      } = buildScheduleMaps(assignments, komaLookup)
      ctx.teacherMap = tm
      ctx.classMap = cm
      ctx.roomMap = rm

      assignments = simulatedAnnealing(
        ctx,
        assignments,
        komaLookup,
        allPositions,
        {
          ...this.config,
          seed: (this.config.seed ?? Date.now()) + patternIndex,
        }
      )
    }

    const violations = evaluateAllConstraints(ctx, assignments)
    const score = calculateScore(violations)

    return {
      assignments,
      violations,
      score,
      elapsedMs: Date.now() - this.startTime,
      isComplete: btResult.complete && score === 0,
    }
  }

  private getTotalKomas(): number {
    return this.input.komas.reduce((sum, k) => sum + k.count, 0)
  }

  private progress(
    phase: SolverProgress["phase"],
    phaseLabel: string,
    patternIndex: number
  ): SolverProgress {
    return {
      phase,
      phaseLabel,
      patternIndex,
      totalPatterns: this.config.maxPatterns,
      placedCount: 0,
      totalKomas: this.getTotalKomas(),
      violations: 0,
      score: 0,
      elapsedMs: Date.now() - this.startTime,
    }
  }
}
