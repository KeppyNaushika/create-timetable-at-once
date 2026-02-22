import type { ConstraintContext } from "./constraints"
import { isPlacementValid } from "./constraints"
import { deepCopyDomain } from "./domain"
import { selectVariableMRVDegree, orderValuesLCV } from "./heuristics"
import type {
  Assignment,
  Domain,
  KomaLookup,
  SlotPosition,
  SolverProgress,
} from "./types"

interface BacktrackResult {
  assignments: Assignment[]
  complete: boolean
}

// 段階的深化バックトラッキング + Forward Checking
export function backtrack(
  ctx: ConstraintContext,
  domain: Domain,
  komaLookup: KomaLookup,
  initialAssignments: Assignment[],
  targets: { komaId: string; index: number }[],
  maxDepth: number,
  onProgress?: (progress: Partial<SolverProgress>) => void
): BacktrackResult {
  const assignments = [...initialAssignments]
  const assignedSet = new Set(
    assignments.map((a) => `${a.komaId}:${a.dayOfWeek}:${a.period}`)
  )

  // Count assignments per koma
  const assignedCountPerKoma: Record<string, number> = {}
  for (const a of assignments) {
    assignedCountPerKoma[a.komaId] = (assignedCountPerKoma[a.komaId] ?? 0) + 1
  }

  // Determine remaining targets
  const remaining = targets.filter((t) => {
    const count = assignedCountPerKoma[t.komaId] ?? 0
    return count <= t.index
  })

  // Deduplicate by komaId (one variable per unique koma needing placement)
  const unassignedKomaIds = [...new Set(remaining.map((t) => t.komaId))]

  let currentDomain = deepCopyDomain(domain)
  let depth = 0
  let nodesExplored = 0

  function solve(unassigned: string[]): boolean {
    if (unassigned.length === 0) return true
    if (depth >= maxDepth) return false

    depth++
    nodesExplored++

    if (nodesExplored % 100 === 0) {
      onProgress?.({
        placedCount: assignments.length,
        message: `BT: ${nodesExplored}ノード探索, 残り${unassigned.length}駒`,
      })
    }

    // Select variable (MRV + degree)
    const komaId = selectVariableMRVDegree(
      unassigned,
      currentDomain,
      komaLookup
    )
    if (!komaId) {
      depth--
      return false
    }

    // Order values (LCV)
    const values = orderValuesLCV(komaId, currentDomain, komaLookup, ctx)

    for (const pos of values) {
      if (!isPlacementValid(ctx, komaId, pos)) continue

      // Place
      const assignment: Assignment = {
        komaId,
        dayOfWeek: pos.dayOfWeek,
        period: pos.period,
      }
      assignments.push(assignment)

      // Update schedule maps in context
      updateContextMaps(ctx, komaLookup, komaId, pos, true)

      // Forward checking: prune domains
      const savedDomain = deepCopyDomain(currentDomain)
      let consistent = true

      const nextUnassigned = unassigned.filter((id) => id !== komaId)
      for (const otherId of nextUnassigned) {
        currentDomain[otherId] = currentDomain[otherId].filter((p) =>
          isPlacementValid(ctx, otherId, p)
        )
        if (currentDomain[otherId].length === 0) {
          consistent = false
          break
        }
      }

      if (consistent && solve(nextUnassigned)) {
        depth--
        return true
      }

      // Backtrack
      assignments.pop()
      updateContextMaps(ctx, komaLookup, komaId, pos, false)
      currentDomain = savedDomain
    }

    depth--
    return false
  }

  const complete = solve(unassignedKomaIds)

  return { assignments, complete }
}

function updateContextMaps(
  ctx: ConstraintContext,
  komaLookup: KomaLookup,
  komaId: string,
  pos: SlotPosition,
  isPlacing: boolean
) {
  const koma = komaLookup[komaId]
  if (!koma) return

  const value = isPlacing ? komaId : null

  for (const tid of koma.teacherIds) {
    if (!ctx.teacherMap[tid]) ctx.teacherMap[tid] = {}
    if (!ctx.teacherMap[tid][pos.dayOfWeek])
      ctx.teacherMap[tid][pos.dayOfWeek] = {}
    ctx.teacherMap[tid][pos.dayOfWeek][pos.period] = value
  }

  for (const cid of koma.classIds) {
    if (!ctx.classMap[cid]) ctx.classMap[cid] = {}
    if (!ctx.classMap[cid][pos.dayOfWeek]) ctx.classMap[cid][pos.dayOfWeek] = {}
    ctx.classMap[cid][pos.dayOfWeek][pos.period] = value
  }

  for (const rid of koma.roomIds) {
    if (!ctx.roomMap[rid]) ctx.roomMap[rid] = {}
    if (!ctx.roomMap[rid][pos.dayOfWeek]) ctx.roomMap[rid][pos.dayOfWeek] = {}
    ctx.roomMap[rid][pos.dayOfWeek][pos.period] = value
  }
}
