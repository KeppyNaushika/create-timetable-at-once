import type { ConstraintContext } from "./constraints"
import {
  evaluateAllConstraints,
  isPlacementValid,
  calculateScore,
  checkPlacement,
} from "./constraints"
import type { Assignment, SlotPosition, Violation } from "./types"

export interface AutoFixSuggestion {
  komaId: string
  currentPos: SlotPosition
  suggestedPos: SlotPosition
  removedViolations: Violation[]
  newViolations: Violation[]
  scoreDelta: number
}

// 違反のある駒を検出し、代替配置を探索
export function findAutoFixes(
  ctx: ConstraintContext,
  assignments: Assignment[],
  maxSuggestions: number = 10
): AutoFixSuggestion[] {
  const allViolations = evaluateAllConstraints(ctx, assignments)
  if (allViolations.length === 0) return []

  // Group violations by komaId
  const violationsByKoma = new Map<string, Violation[]>()
  for (const v of allViolations) {
    if (!v.komaId) continue
    if (!violationsByKoma.has(v.komaId)) {
      violationsByKoma.set(v.komaId, [])
    }
    violationsByKoma.get(v.komaId)!.push(v)
  }

  const suggestions: AutoFixSuggestion[] = []

  // For each violating koma, try alternative positions
  for (const [komaId, violations] of violationsByKoma) {
    const currentAssignment = assignments.find((a) => a.komaId === komaId)
    if (!currentAssignment) continue

    const currentPos: SlotPosition = {
      dayOfWeek: currentAssignment.dayOfWeek,
      period: currentAssignment.period,
    }

    // Try each possible position
    for (let d = 0; d < 6; d++) {
      for (let p = 1; p <= 7; p++) {
        if (d === currentPos.dayOfWeek && p === currentPos.period) continue

        const newPos: SlotPosition = { dayOfWeek: d, period: p }

        // Temporarily remove current and check new position
        const withoutCurrent = assignments.filter(
          (a) =>
            !(
              a.komaId === komaId &&
              a.dayOfWeek === currentPos.dayOfWeek &&
              a.period === currentPos.period
            )
        )

        if (!isPlacementValid(ctx, komaId, newPos)) continue

        const newViolations = checkPlacement(
          ctx,
          komaId,
          newPos,
          withoutCurrent
        )
        const scoreDelta =
          calculateScore(newViolations) - calculateScore(violations)

        if (scoreDelta < 0) {
          suggestions.push({
            komaId,
            currentPos,
            suggestedPos: newPos,
            removedViolations: violations,
            newViolations,
            scoreDelta,
          })
        }
      }
    }
  }

  suggestions.sort((a, b) => a.scoreDelta - b.scoreDelta)
  return suggestions.slice(0, maxSuggestions)
}
