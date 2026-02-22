import type { ConstraintContext } from "./constraints"
import { checkPlacement } from "./constraints"
import type { Domain, KomaLookup, SlotPosition } from "./types"

// MRV (Minimum Remaining Values) — ドメインが最も小さい駒を選択
export function selectVariableMRV(
  unassigned: string[],
  domain: Domain
): string | null {
  if (unassigned.length === 0) return null

  let minSize = Infinity
  let selected: string | null = null

  for (const komaId of unassigned) {
    const size = domain[komaId]?.length ?? 0
    if (size < minSize) {
      minSize = size
      selected = komaId
    }
  }

  return selected
}

// LCV (Least Constraining Value) — 他の駒のドメインを最も制限しない値を先に試す
export function orderValuesLCV(
  komaId: string,
  domain: Domain,
  komaLookup: KomaLookup,
  ctx: ConstraintContext
): SlotPosition[] {
  const positions = domain[komaId]
  if (!positions || positions.length === 0) return []

  // Score each position by how many violations it causes
  const scored = positions.map((pos) => {
    const violations = checkPlacement(ctx, komaId, pos)
    const score = violations.reduce((sum, v) => sum + v.weight, 0)
    return { pos, score }
  })

  // Sort by ascending score (least constraining first)
  scored.sort((a, b) => a.score - b.score)

  return scored.map((s) => s.pos)
}

// Degree heuristic — 未割当の隣接変数が最も多い駒を選択 (タイブレーカーとして使用)
export function selectVariableMRVDegree(
  unassigned: string[],
  domain: Domain,
  komaLookup: KomaLookup
): string | null {
  if (unassigned.length === 0) return null

  let bestId: string | null = null
  let bestDomainSize = Infinity
  let bestDegree = -1

  const unassignedSet = new Set(unassigned)

  for (const komaId of unassigned) {
    const domainSize = domain[komaId]?.length ?? 0

    if (domainSize < bestDomainSize) {
      bestDomainSize = domainSize
      bestDegree = countDegree(komaId, unassignedSet, komaLookup)
      bestId = komaId
    } else if (domainSize === bestDomainSize) {
      const degree = countDegree(komaId, unassignedSet, komaLookup)
      if (degree > bestDegree) {
        bestDegree = degree
        bestId = komaId
      }
    }
  }

  return bestId
}

function countDegree(
  komaId: string,
  unassigned: Set<string>,
  komaLookup: KomaLookup
): number {
  const koma = komaLookup[komaId]
  if (!koma) return 0

  let degree = 0
  for (const otherId of unassigned) {
    if (otherId === komaId) continue
    const other = komaLookup[otherId]
    if (!other) continue

    const sharesTeacher = koma.teacherIds.some((t) =>
      other.teacherIds.includes(t)
    )
    const sharesClass = koma.classIds.some((c) => other.classIds.includes(c))
    const sharesRoom = koma.roomIds.some((r) => other.roomIds.includes(r))
    if (sharesTeacher || sharesClass || sharesRoom) degree++
  }

  return degree
}
