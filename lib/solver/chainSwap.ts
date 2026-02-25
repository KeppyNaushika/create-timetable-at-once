import type { ConstraintContext } from "./constraints"
import { calculateScore, checkPlacement, isPlacementValid } from "./constraints"
import type { Assignment, SlotPosition } from "./types"

export interface SwapStep {
  komaId: string
  from: SlotPosition
  to: SlotPosition
}

export interface SwapProposal {
  chain: SwapStep[]
  scoreDelta: number // negative = improvement
  description: string
}

// 連鎖入れ替え探索
export function findSwapChains(
  ctx: ConstraintContext,
  targetKomaId: string,
  targetPos: SlotPosition,
  assignments: Assignment[],
  _maxDepth: number = 5,
  maxCandidates: number = 20
): SwapProposal[] {
  const proposals: SwapProposal[] = []
  const assignmentMap = new Map<string, Assignment[]>() // komaId -> assignments

  for (const a of assignments) {
    if (!assignmentMap.has(a.komaId)) {
      assignmentMap.set(a.komaId, [])
    }
    assignmentMap.get(a.komaId)!.push(a)
  }

  // Find who occupies the target position
  const occupiers = assignments.filter(
    (a) => a.dayOfWeek === targetPos.dayOfWeek && a.period === targetPos.period
  )

  if (occupiers.length === 0) {
    // Direct placement possible
    if (isPlacementValid(ctx, targetKomaId, targetPos)) {
      proposals.push({
        chain: [
          {
            komaId: targetKomaId,
            from: { dayOfWeek: -1, period: -1 },
            to: targetPos,
          },
        ],
        scoreDelta: -10,
        description: "直接配置",
      })
    }
    return proposals
  }

  // Try single swap: move occupier elsewhere, place target
  for (const occupier of occupiers) {
    const occupierKoma = ctx.komaLookup[occupier.komaId]
    if (!occupierKoma) continue

    // Find alternative positions for the occupier
    for (let d = 0; d < 6; d++) {
      for (let p = 1; p <= 7; p++) {
        const altPos: SlotPosition = { dayOfWeek: d, period: p }
        if (d === targetPos.dayOfWeek && p === targetPos.period) continue

        if (isPlacementValid(ctx, occupier.komaId, altPos)) {
          const chain: SwapStep[] = [
            {
              komaId: occupier.komaId,
              from: { dayOfWeek: occupier.dayOfWeek, period: occupier.period },
              to: altPos,
            },
            {
              komaId: targetKomaId,
              from: { dayOfWeek: -1, period: -1 },
              to: targetPos,
            },
          ]

          // Calculate score delta
          const currentViolations = checkPlacement(
            ctx,
            occupier.komaId,
            occupier,
            assignments
          )
          const newViolations = checkPlacement(
            ctx,
            occupier.komaId,
            altPos,
            assignments
          )
          const scoreDelta =
            calculateScore(newViolations) - calculateScore(currentViolations)

          proposals.push({
            chain,
            scoreDelta,
            description: `${occupierKoma.subject?.shortName ?? "?"}を移動して配置`,
          })

          if (proposals.length >= maxCandidates) return proposals
        }
      }
    }
  }

  proposals.sort((a, b) => a.scoreDelta - b.scoreDelta)
  return proposals.slice(0, maxCandidates)
}
