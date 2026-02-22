import type { ConstraintContext } from "./constraints"
import { isPlacementValid } from "./constraints"
import type { Domain, KomaLookup, SlotPosition } from "./types"

// 各駒に対して配置可能なスロットのドメインを計算
export function computeInitialDomains(
  komaIds: string[],
  allPositions: SlotPosition[],
  ctx: ConstraintContext
): Domain {
  const domain: Domain = {}
  for (const komaId of komaIds) {
    domain[komaId] = allPositions.filter((pos) =>
      isPlacementValid(ctx, komaId, pos)
    )
  }
  return domain
}

// AC-3 制約伝播
// 先生/クラス/教室の排他制約をアーク整合性で伝播
export function ac3(
  domain: Domain,
  komaLookup: KomaLookup,
  ctx: ConstraintContext
): { consistent: boolean; domain: Domain } {
  const result = deepCopyDomain(domain)
  const queue: [string, string][] = [] // [komaId1, komaId2]

  // 同一リソースを共有する駒ペアをキューに追加
  const komaIds = Object.keys(result)
  for (let i = 0; i < komaIds.length; i++) {
    for (let j = i + 1; j < komaIds.length; j++) {
      if (sharesResource(komaIds[i], komaIds[j], komaLookup)) {
        queue.push([komaIds[i], komaIds[j]])
        queue.push([komaIds[j], komaIds[i]])
      }
    }
  }

  while (queue.length > 0) {
    const [xi, xj] = queue.shift()!
    if (revise(result, xi, xj, komaLookup)) {
      if (result[xi].length === 0) {
        return { consistent: false, domain: result }
      }
      // Add neighbors back to queue
      for (const xk of komaIds) {
        if (xk !== xi && xk !== xj && sharesResource(xk, xi, komaLookup)) {
          queue.push([xk, xi])
        }
      }
    }
  }

  return { consistent: true, domain: result }
}

function revise(
  domain: Domain,
  xi: string,
  xj: string,
  komaLookup: KomaLookup
): boolean {
  let revised = false
  const komaI = komaLookup[xi]
  const komaJ = komaLookup[xj]
  if (!komaI || !komaJ) return false

  domain[xi] = domain[xi].filter((posI) => {
    // Check if there exists at least one value in xj's domain consistent with posI
    const hasSupport = domain[xj].some(
      (posJ) => !conflictsAt(posI, posJ, komaI, komaJ)
    )
    if (!hasSupport) revised = true
    return hasSupport
  })

  return revised
}

function sharesResource(
  komaIdA: string,
  komaIdB: string,
  komaLookup: KomaLookup
): boolean {
  const a = komaLookup[komaIdA]
  const b = komaLookup[komaIdB]
  if (!a || !b) return false

  // Share teacher
  for (const tid of a.teacherIds) {
    if (b.teacherIds.includes(tid)) return true
  }
  // Share class
  for (const cid of a.classIds) {
    if (b.classIds.includes(cid)) return true
  }
  // Share room
  for (const rid of a.roomIds) {
    if (b.roomIds.includes(rid)) return true
  }
  return false
}

function conflictsAt(
  posA: SlotPosition,
  posB: SlotPosition,
  komaA: { teacherIds: string[]; classIds: string[]; roomIds: string[] },
  komaB: { teacherIds: string[]; classIds: string[]; roomIds: string[] }
): boolean {
  // Same slot = conflict if sharing resources
  if (posA.dayOfWeek !== posB.dayOfWeek || posA.period !== posB.period)
    return false

  for (const tid of komaA.teacherIds) {
    if (komaB.teacherIds.includes(tid)) return true
  }
  for (const cid of komaA.classIds) {
    if (komaB.classIds.includes(cid)) return true
  }
  for (const rid of komaA.roomIds) {
    if (komaB.roomIds.includes(rid)) return true
  }
  return false
}

function deepCopyDomain(domain: Domain): Domain {
  const copy: Domain = {}
  for (const [k, v] of Object.entries(domain)) {
    copy[k] = [...v]
  }
  return copy
}

export { deepCopyDomain }
