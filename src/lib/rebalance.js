// Allocation math and rebalancing suggestions.

// Variance thresholds (in percentage points) for color coding.
export const VARIANCE_THRESHOLDS = {
  onTarget: 2, // within ±2%  -> green
  minor: 5, // within ±5%   -> yellow, beyond -> red
}

/** Classify a variance (current% - target%) into a status string. */
export function varianceStatus(variance) {
  const abs = Math.abs(variance)
  if (abs <= VARIANCE_THRESHOLDS.onTarget) return 'on-target'
  if (abs <= VARIANCE_THRESHOLDS.minor) return 'minor'
  return 'major'
}

/** Total value of a single holding. */
export function holdingValue(holding) {
  const qty = Number(holding.quantity)
  const price = Number(holding.unitPrice)
  if (Number.isNaN(qty) || Number.isNaN(price)) return 0
  return qty * price
}

/**
 * Compute the full portfolio analysis.
 *
 * @param {Array} holdings  current holdings
 * @param {Array} targets   [{ assetType, targetPercentage }]
 * @returns {{
 *   totalValue: number,
 *   byType: Array<{ assetType, value, currentPercentage, targetPercentage, variance, status, holdingsCount }>,
 *   suggestion: object|null
 * }}
 */
export function analyzePortfolio(holdings, targets) {
  const totalValue = holdings.reduce((sum, h) => sum + holdingValue(h), 0)

  // Union of asset types: those defined in the target CSV plus any extra ones
  // a holding might be tagged with (so nothing is silently dropped).
  const targetMap = new Map(targets.map((t) => [t.assetType, t.targetPercentage]))
  const allTypes = new Set(targets.map((t) => t.assetType))
  holdings.forEach((h) => {
    if (h.assetType) allTypes.add(h.assetType)
  })

  const byType = [...allTypes].map((assetType) => {
    const typeHoldings = holdings.filter((h) => h.assetType === assetType)
    const value = typeHoldings.reduce((sum, h) => sum + holdingValue(h), 0)
    const currentPercentage = totalValue > 0 ? (value / totalValue) * 100 : 0
    const targetPercentage = targetMap.has(assetType) ? targetMap.get(assetType) : 0
    const variance = currentPercentage - targetPercentage
    return {
      assetType,
      value,
      currentPercentage,
      targetPercentage,
      variance,
      status: varianceStatus(variance),
      holdingsCount: typeHoldings.length,
      inTarget: targetMap.has(assetType),
    }
  })

  // Sort by target weight desc (then current) for stable, sensible display.
  byType.sort((a, b) => b.targetPercentage - a.targetPercentage || b.value - a.value)

  const suggestion = buildSuggestion(byType, totalValue)

  return { totalValue, byType, suggestion }
}

/**
 * Build the "what to invest in next" suggestion.
 *
 * We pick the asset type that is furthest BELOW its target (largest negative
 * variance). We then compute how much new money to add to bring that single
 * type up to its target weight, holding everything else constant.
 *
 * If we add X dollars to one type:
 *   (value + X) / (total + X) = target/100
 * Solving for X:
 *   X = (target/100 * total - value) / (1 - target/100)
 */
function buildSuggestion(byType, totalValue) {
  // Only consider asset types that are part of the target allocation.
  const candidates = byType.filter((t) => t.inTarget && t.targetPercentage > 0)
  if (candidates.length === 0 || totalValue <= 0) return null

  // Furthest below target = most negative variance.
  const sorted = [...candidates].sort((a, b) => a.variance - b.variance)
  const target = sorted[0]

  // If everything is already at/above target, congratulate the user.
  if (target.variance >= 0) {
    return {
      type: 'balanced',
      assetType: null,
      amount: 0,
      message: 'Your portfolio is on or above target across all asset types. Nicely balanced!',
    }
  }

  const t = target.targetPercentage / 100
  let amount = 0
  if (t < 1) {
    amount = (t * totalValue - target.value) / (1 - t)
  }
  amount = Math.max(0, amount)

  // Secondary candidates (other underweight types) for a fuller picture.
  const others = sorted
    .slice(1)
    .filter((c) => c.variance < -VARIANCE_THRESHOLDS.onTarget)
    .map((c) => c.assetType)

  return {
    type: 'invest',
    assetType: target.assetType,
    amount,
    currentPercentage: target.currentPercentage,
    targetPercentage: target.targetPercentage,
    variance: target.variance,
    alsoUnderweight: others,
    message: `Invest ${formatAmount(amount)} in ${target.assetType} to reach your ${target.targetPercentage.toFixed(
      0,
    )}% target.`,
  }
}

function formatAmount(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

// Chart-friendly color per status.
export const STATUS_COLORS = {
  'on-target': '#16a34a', // green-600
  minor: '#d97706', // amber-600
  major: '#dc2626', // red-600
}

// A pleasant categorical palette for the pie/legend.
export const CATEGORY_PALETTE = [
  '#1e6fd9',
  '#16a34a',
  '#d97706',
  '#9333ea',
  '#dc2626',
  '#0891b2',
  '#db2777',
  '#65a30d',
  '#ea580c',
  '#4f46e5',
  '#0d9488',
  '#a16207',
]

export function colorForIndex(index) {
  return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length]
}
