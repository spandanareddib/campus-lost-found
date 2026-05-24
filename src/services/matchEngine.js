// ─── Match Engine — implements PRD §6.2 scoring logic ─────────────────────────

export const MATCH_THRESHOLD = 0.6

/**
 * scoreMatch — scores a FoundItem against a LostItemReport.
 * Returns a float 0–1. Triggers notification if >= MATCH_THRESHOLD.
 *
 * Weights:
 *   Category   0.40
 *   Colour     0.20 (first overlap) + 0.10 (second)
 *   Brand      0.15
 *   Building   0.15
 */
export function scoreMatch(foundItem, lir) {
  let score = 0

  // Category match (weight: 0.4)
  if (foundItem.tags.category === lir.structured.category) {
    score += 0.4
  }

  // Colour overlap (weight: 0.3 total)
  const colourOverlap = foundItem.tags.colours.filter(
    (c) => lir.structured.colours.includes(c)
  ).length

  if (colourOverlap > 0) score += 0.2
  if (colourOverlap > 1) score += 0.1

  // Brand match (weight: 0.15)
  if (
    foundItem.tags.brand &&
    lir.structured.brand &&
    foundItem.tags.brand.toLowerCase() === lir.structured.brand.toLowerCase()
  ) {
    score += 0.15
  }

  // Building proximity (weight: 0.15)
  if (foundItem.location.building === lir.structured.lastSeenBuilding) {
    score += 0.15
  }

  // Date range gate (not scored — eliminates items found before loss)
  if (lir.structured.lastSeenDateFrom) {
    const foundDate = new Date(foundItem.location.foundAt)
    const from = new Date(lir.structured.lastSeenDateFrom)
    if (foundDate < from) return 0
  }

  return parseFloat(score.toFixed(2))
}

/**
 * findMatches — runs all LIRs against a single FoundItem.
 * Returns array of { lir, score } sorted desc, filtered by threshold.
 */
export function findMatches(foundItem, lirs) {
  return lirs
    .map((lir) => ({ lir, score: scoreMatch(foundItem, lir) }))
    .filter(({ score }) => score >= MATCH_THRESHOLD)
    .sort((a, b) => b.score - a.score)
}

/**
 * getBestScoreForItem — returns the highest match score for a found item
 * against all open LIRs. Used to show match badge in search results.
 */
export function getBestScoreForItem(foundItem, lirs) {
  const openLirs = lirs.filter((l) => l.status === 'OPEN' || l.status === 'MATCHED')
  if (!openLirs.length) return 0
  const scores = openLirs.map((lir) => scoreMatch(foundItem, lir))
  return Math.max(...scores)
}

/**
 * getScoreLabel — returns human-readable match label
 */
export function getScoreLabel(score) {
  if (score >= 0.85) return 'Strong match'
  if (score >= 0.7) return 'Good match'
  if (score >= 0.6) return 'Possible match'
  return null
}

/**
 * getScoreColor — tailwind color class for score badge
 */
export function getScoreColor(score) {
  if (score >= 0.85) return 'bg-success-bg text-success border-success-border/50'
  if (score >= 0.7) return 'bg-brand-50 text-brand-600 border-brand-200/50'
  if (score >= 0.6) return 'bg-warning-bg text-warning border-warning-border/50'
  return ''
}
