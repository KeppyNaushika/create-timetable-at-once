import type { ConstraintContext } from "./constraints"
import {
  evaluateAllConstraints,
  calculateScoreFast,
  computeKomaPlacementCost,
  setTeacherCache,
} from "./constraints"
import { greedyConstruct } from "./greedyConstruct"
import { addToMaps } from "./incrementalMaps"
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
  KomaLookup,
  SlotPosition,
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

    // 全パターンのスコア一覧を記録
    const allPatternScores = results.map((r, i) => ({
      index: i + 1,
      score: r.score,
      violations: r.violations.length,
    }))

    results.sort((a, b) => a.score - b.score)
    const best = results[0]
    const selectedIndex = results.indexOf(best)

    return {
      ...best,
      allPatternScores,
      selectedPatternIndex: allPatternScores.findIndex(
        (p) => p.score === best.score
      ),
    }
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

    // ── Phase 2.5: 重複除去 + 未配置コマ補充 ──
    const deduped = deduplicateAssignments(bestAssignments)

    // マップ再構築（タブー探索後の ctx マップは最終解と一致しない）
    for (const k of Object.keys(ctx.teacherMap)) delete ctx.teacherMap[k]
    for (const k of Object.keys(ctx.classMap)) delete ctx.classMap[k]
    for (const k of Object.keys(ctx.roomMap)) delete ctx.roomMap[k]
    const rebuilt = buildScheduleMaps(deduped, komaLookup)
    Object.assign(ctx.teacherMap, rebuilt.teacherMap)
    Object.assign(ctx.classMap, rebuilt.classMap)
    Object.assign(ctx.roomMap, rebuilt.roomMap)

    const filledAssignments = fillMissingAssignments(
      ctx,
      deduped,
      targets,
      komaLookup,
      allPositions
    )

    sendProgress({
      phase: "construction",
      phaseLabel: "未配置補充完了",
      placedCount: filledAssignments.length,
      message: `補充完了: ${filledAssignments.length}/${totalKomas}コマ`,
    })

    // ── Phase 3: 最終評価 ──
    // 違反の詳細リストを取得（UI表示用）
    const violations = evaluateAllConstraints(ctx, filledAssignments)
    // スコアは calculateScoreFast（タブー探索と同じ computeKomaPlacementCost ベース）
    // + 未配置コマペナルティで統一（evaluateAllConstraints のスコアズレを防止）
    const scoreMapData = buildScheduleMaps(filledAssignments, komaLookup)
    const scoreCtx: ConstraintContext = { ...ctx, ...scoreMapData }
    let score = calculateScoreFast(scoreCtx, filledAssignments)
    for (const v of violations) {
      if (v.type === "unplaced") score += v.weight
    }

    return {
      assignments: filledAssignments,
      violations,
      score,
      elapsedMs: Date.now() - this.startTime,
      isComplete:
        checkAllKomasPlaced(filledAssignments, targets) && score === 0,
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

// ── ヘルパー関数 ──

function deduplicateAssignments(assignments: Assignment[]): Assignment[] {
  const seen = new Set<string>()
  const result: Assignment[] = []
  for (const a of assignments) {
    const key = `${a.komaId}:${a.dayOfWeek}:${a.period}`
    if (!seen.has(key)) {
      seen.add(key)
      result.push(a)
    }
  }
  return result
}

function fillMissingAssignments(
  ctx: ConstraintContext,
  assignments: Assignment[],
  targets: { komaId: string; index: number }[],
  komaLookup: KomaLookup,
  allPositions: SlotPosition[]
): Assignment[] {
  const result = [...assignments]

  const placedCount = new Map<string, number>()
  for (const a of result) {
    placedCount.set(a.komaId, (placedCount.get(a.komaId) ?? 0) + 1)
  }

  const requiredCount = new Map<string, number>()
  for (const t of targets) {
    requiredCount.set(
      t.komaId,
      Math.max(requiredCount.get(t.komaId) ?? 0, t.index + 1)
    )
  }

  for (const [komaId, required] of requiredCount) {
    let placed = placedCount.get(komaId) ?? 0
    while (placed < required) {
      let bestPos: SlotPosition | null = null
      let bestCost = Infinity

      for (const pos of allPositions) {
        const cost = computeKomaPlacementCost(ctx, komaId, pos)
        if (cost < bestCost) {
          bestCost = cost
          bestPos = pos
        }
      }

      if (bestPos) {
        result.push({
          komaId,
          dayOfWeek: bestPos.dayOfWeek,
          period: bestPos.period,
        })
        addToMaps(ctx, komaLookup, komaId, bestPos)
        placed++
      } else {
        break
      }
    }
  }

  return result
}

function checkAllKomasPlaced(
  assignments: Assignment[],
  targets: { komaId: string; index: number }[]
): boolean {
  const placedCount = new Map<string, number>()
  for (const a of assignments) {
    placedCount.set(a.komaId, (placedCount.get(a.komaId) ?? 0) + 1)
  }

  const requiredCount = new Map<string, number>()
  for (const t of targets) {
    requiredCount.set(
      t.komaId,
      Math.max(requiredCount.get(t.komaId) ?? 0, t.index + 1)
    )
  }

  for (const [komaId, required] of requiredCount) {
    if ((placedCount.get(komaId) ?? 0) < required) return false
  }
  return true
}
