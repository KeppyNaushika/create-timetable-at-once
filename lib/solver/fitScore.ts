import type { ConstraintContext } from "./constraints"
import { checkPlacement } from "./constraints"
import type { Assignment, KomaLookup, SlotPosition } from "./types"

// 適合度スコア: 低いほど良い（0 = 完全適合）
export function calculateFitScore(
  ctx: ConstraintContext,
  komaId: string,
  pos: SlotPosition,
  allAssignments: Assignment[] = []
): number {
  const violations = checkPlacement(ctx, komaId, pos, allAssignments)
  if (violations.length === 0) return 0

  return violations.reduce((sum, v) => {
    if (v.severity === "error") return sum + v.weight * 10
    return sum + v.weight
  }, 0)
}

// 選択セルに配置可能な駒一覧（適合度スコア付き）
export function getComingKomas(
  ctx: ConstraintContext,
  pos: SlotPosition,
  unplacedKomaIds: string[],
  allAssignments: Assignment[]
): { komaId: string; score: number }[] {
  const results: { komaId: string; score: number }[] = []

  for (const komaId of unplacedKomaIds) {
    const koma = ctx.komaLookup[komaId]
    if (!koma) continue

    // Check hard constraints
    const hasTeacherConflict = koma.teacherIds.some((tid) => {
      return ctx.teacherMap[tid]?.[pos.dayOfWeek]?.[pos.period] != null
    })
    const hasClassConflict = koma.classIds.some((cid) => {
      return ctx.classMap[cid]?.[pos.dayOfWeek]?.[pos.period] != null
    })

    if (hasTeacherConflict || hasClassConflict) continue

    const score = calculateFitScore(ctx, komaId, pos, allAssignments)
    results.push({ komaId, score })
  }

  results.sort((a, b) => a.score - b.score)
  return results
}

// 選択駒の配置可能場所一覧
export function getKomaDestinations(
  ctx: ConstraintContext,
  komaId: string,
  allPositions: SlotPosition[],
  allAssignments: Assignment[]
): { pos: SlotPosition; score: number }[] {
  const results: { pos: SlotPosition; score: number }[] = []

  for (const pos of allPositions) {
    const koma = ctx.komaLookup[komaId]
    if (!koma) continue

    const hasTeacherConflict = koma.teacherIds.some((tid) => {
      return ctx.teacherMap[tid]?.[pos.dayOfWeek]?.[pos.period] != null
    })
    const hasClassConflict = koma.classIds.some((cid) => {
      return ctx.classMap[cid]?.[pos.dayOfWeek]?.[pos.period] != null
    })

    if (hasTeacherConflict || hasClassConflict) continue

    const score = calculateFitScore(ctx, komaId, pos, allAssignments)
    results.push({ pos, score })
  }

  results.sort((a, b) => a.score - b.score)
  return results
}
