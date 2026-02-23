import type { ConstraintContext } from "./constraints"
import {
  evaluateAllConstraints,
  calculateScore,
  setTeacherCache,
} from "./constraints"
import { greedyConstruct } from "./greedyConstruct"
import { tabuSearch } from "./localSearch"
import { SeededRandom } from "./random"
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
  private progressCallback?: (p: SolverProgress) => void

  constructor(input: SolverInput, config: SolverConfig) {
    this.input = input
    this.config = config
  }

  setProgressCallback(cb: (p: SolverProgress) => void) {
    this.progressCallback = cb
  }

  async *solve(): AsyncGenerator<SolverProgress, SolverResult> {
    this.startTime = Date.now()
    const results: SolverResult[] = []
    const totalKomas = this.getTotalKomas()

    for (let pi = 0; pi < this.config.maxPatterns; pi++) {
      if (Date.now() - this.startTime > this.config.maxTimeMs) break

      yield this.makeProgress("construction", "貪欲構築", pi, 0, totalKomas)

      const remainingMs = this.config.maxTimeMs - (Date.now() - this.startTime)
      if (remainingMs <= 0) break

      const result = await this.solveOne(pi, remainingMs, totalKomas)
      results.push(result)

      yield {
        phase: "done",
        phaseLabel: "完了",
        patternIndex: pi,
        totalPatterns: this.config.maxPatterns,
        placedCount: result.assignments.length,
        totalKomas,
        violations: result.violations.length,
        score: result.score,
        elapsedMs: Date.now() - this.startTime,
      }
    }

    results.sort((a, b) => a.score - b.score)
    return results[0]
  }

  private async solveOne(
    patternIndex: number,
    remainingMs: number,
    totalKomas: number
  ): Promise<SolverResult> {
    const komaLookup = buildKomaLookup(this.input.komas)
    const teacherAvailMap = buildTeacherAvailabilityMap(this.input.teachers)
    const roomAvailMap = buildRoomAvailabilityMap(this.input.rooms)
    const dutyMap = buildDutyMap(this.input.duties)
    const allPositions = getAllSlotPositions(this.input)

    setTeacherCache(this.input.teachers)

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

    const sendProgress = (partial: Partial<SolverProgress>) => {
      this.progressCallback?.({
        phase: partial.phase ?? "construction",
        phaseLabel: partial.phaseLabel ?? "貪欲構築",
        patternIndex,
        totalPatterns: this.config.maxPatterns,
        placedCount: partial.placedCount ?? 0,
        totalKomas,
        violations: partial.violations ?? 0,
        score: partial.score ?? 0,
        elapsedMs: Date.now() - this.startTime,
        message: partial.message,
      })
    }

    const targets = expandKomasToAssignmentTargets(this.input.komas)
    const rng = new SeededRandom((this.config.seed ?? Date.now()) + patternIndex)

    // ── Phase 1: 貪欲構築 ──
    sendProgress({
      phase: "construction",
      phaseLabel: "貪欲構築",
      placedCount: fixedAssignments.length,
    })

    const greedyAssignments = greedyConstruct(
      ctx,
      komaLookup,
      allPositions,
      fixedAssignments,
      targets,
      rng,
      (p) => sendProgress(p)
    )

    // ── Phase 2: タブー探索 ──
    // パターンごとの残り時間を正確に計算
    const tabuDeadline = Math.max(
      this.config.maxTimeMs - (Date.now() - this.startTime),
      5000
    )

    sendProgress({
      phase: "localSearch",
      phaseLabel: "局所探索",
      placedCount: greedyAssignments.length,
    })

    const bestAssignments = tabuSearch(
      ctx,
      greedyAssignments,
      komaLookup,
      allPositions,
      {
        ...this.config,
        seed: (this.config.seed ?? Date.now()) + patternIndex,
      },
      (p) => sendProgress(p),
      tabuDeadline
    )

    // ── Phase 3: 最終評価 ──
    const violations = evaluateAllConstraints(ctx, bestAssignments)
    const score = calculateScore(violations)

    return {
      assignments: bestAssignments,
      violations,
      score,
      elapsedMs: Date.now() - this.startTime,
      isComplete: bestAssignments.length >= totalKomas && score === 0,
    }
  }

  private getTotalKomas(): number {
    return this.input.komas.reduce((sum, k) => sum + k.count, 0)
  }

  private makeProgress(
    phase: SolverProgress["phase"],
    phaseLabel: string,
    patternIndex: number,
    placedCount: number,
    totalKomas: number
  ): SolverProgress {
    return {
      phase,
      phaseLabel,
      patternIndex,
      totalPatterns: this.config.maxPatterns,
      placedCount,
      totalKomas,
      violations: 0,
      score: 0,
      elapsedMs: Date.now() - this.startTime,
    }
  }
}
