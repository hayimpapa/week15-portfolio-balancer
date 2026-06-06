// Asset-type auto-classification + ticker auto-detection.
//
// The goal is a lightweight, transparent "best guess" that the user can always
// override. We combine three signals:
//   1. A small dictionary of well-known tickers -> category keywords.
//   2. Keywords derived from the CSV asset-type names themselves.
//   3. A built-in synonym dictionary for common asset classes.

// Known ticker -> descriptive keywords (helps map "VAS" -> "Australian Shares").
const KNOWN_TICKERS = {
  VAS: ['australian', 'shares'],
  STW: ['australian', 'shares'],
  A200: ['australian', 'shares'],
  IOZ: ['australian', 'shares'],
  VHY: ['australian', 'shares', 'dividend'],
  VGS: ['international', 'global', 'shares'],
  IWLD: ['international', 'global', 'shares'],
  VTS: ['us', 'american', 'shares'],
  VTI: ['us', 'american', 'shares'],
  IVV: ['us', 'american', 'shares', 's&p'],
  VOO: ['us', 'american', 'shares', 's&p'],
  SPY: ['us', 'american', 'shares', 's&p'],
  QQQ: ['us', 'american', 'shares', 'nasdaq', 'tech'],
  VEU: ['international', 'global', 'shares'],
  VGE: ['emerging', 'markets', 'shares'],
  VAE: ['asia', 'emerging', 'shares'],
  BND: ['bond', 'bonds', 'fixed', 'income'],
  VAF: ['bond', 'bonds', 'fixed', 'income', 'australian'],
  VGB: ['bond', 'bonds', 'government'],
  VBND: ['bond', 'bonds', 'global', 'fixed', 'income'],
  AGG: ['bond', 'bonds', 'fixed', 'income'],
  VAP: ['property', 'reit', 'real', 'estate'],
  DJRE: ['property', 'reit', 'real', 'estate', 'global'],
  GOLD: ['gold', 'commodity', 'commodities'],
  PMGOLD: ['gold', 'commodity', 'commodities'],
  BTC: ['crypto', 'bitcoin', 'cryptocurrency'],
  ETH: ['crypto', 'ethereum', 'cryptocurrency'],
}

// Synonyms that expand a category token into more matchable keywords.
const SYNONYMS = {
  australian: ['australian', 'australia', 'aus', 'asx', 'domestic', 'local'],
  international: ['international', 'global', 'world', 'developed', 'ex-australia', 'overseas', 'intl'],
  us: ['us', 'usa', 'american', 'america', 's&p', 'nasdaq', 'sp500'],
  emerging: ['emerging', 'developing', 'em'],
  bonds: ['bond', 'bonds', 'fixed', 'income', 'treasury', 'credit', 'debt'],
  property: ['property', 'reit', 'reits', 'real', 'estate', 'infrastructure'],
  cash: ['cash', 'money', 'savings', 'deposit', 'hisa', 'term'],
  gold: ['gold', 'silver', 'commodity', 'commodities', 'metals'],
  crypto: ['crypto', 'cryptocurrency', 'bitcoin', 'ethereum', 'digital'],
  shares: ['share', 'shares', 'stock', 'stocks', 'equity', 'equities'],
  dividend: ['dividend', 'yield', 'income'],
}

function tokenize(text) {
  return String(text)
    .toLowerCase()
    .split(/[^a-z0-9&]+/)
    .filter(Boolean)
}

// Expand an asset-type name into a rich set of keywords for matching.
function keywordsForType(assetType) {
  const tokens = tokenize(assetType)
  const keywords = new Set(tokens)
  for (const token of tokens) {
    for (const [, synonyms] of Object.entries(SYNONYMS)) {
      if (synonyms.includes(token)) {
        synonyms.forEach((s) => keywords.add(s))
      }
    }
  }
  return keywords
}

/**
 * Suggest the most likely asset type (from the CSV-provided list) for an asset.
 * @param {string} assetName  e.g. "Vanguard Australian Shares" or "VAS"
 * @param {string} ticker     optional ticker, e.g. "VAS.AX"
 * @param {string[]} assetTypes  asset types parsed from the CSV
 * @returns {{ assetType: string|null, confidence: number }}
 */
export function suggestAssetType(assetName, ticker, assetTypes) {
  if (!assetTypes || assetTypes.length === 0) {
    return { assetType: null, confidence: 0 }
  }

  // Collect keywords describing the asset from its name + known-ticker dict.
  const assetKeywords = new Set(tokenize(assetName))
  const tickerKey = (ticker || assetName || '').toUpperCase().replace(/\..*$/, '').trim()
  if (KNOWN_TICKERS[tickerKey]) {
    KNOWN_TICKERS[tickerKey].forEach((k) => assetKeywords.add(k))
  }
  // Expand asset keywords via synonyms too, so "global" matches "international".
  for (const token of [...assetKeywords]) {
    for (const synonyms of Object.values(SYNONYMS)) {
      if (synonyms.includes(token)) synonyms.forEach((s) => assetKeywords.add(s))
    }
  }

  let best = { assetType: null, confidence: 0 }
  for (const type of assetTypes) {
    const typeKeywords = keywordsForType(type)
    let overlap = 0
    for (const kw of typeKeywords) {
      if (assetKeywords.has(kw)) overlap++
    }
    // Normalize by the type's keyword count so short, specific types aren't
    // unfairly penalised; bias slightly toward more matches.
    const confidence = overlap === 0 ? 0 : overlap / Math.sqrt(typeKeywords.size)
    if (confidence > best.confidence) {
      best = { assetType: type, confidence }
    }
  }

  // Fall back to the first asset type if nothing matched, but mark low confidence.
  if (!best.assetType) {
    return { assetType: assetTypes[0], confidence: 0 }
  }
  return best
}

/**
 * Best-effort ticker auto-detection from an asset name.
 * If the name already looks like a ticker (short, all caps/alphanumeric) we use
 * it directly; otherwise we return '' so the user can supply one.
 */
export function detectTicker(assetName) {
  const trimmed = String(assetName || '').trim()
  if (!trimmed) return ''

  // Already looks like a ticker, e.g. "VAS", "VAS.AX", "BRK.B".
  if (/^[A-Za-z]{1,6}(\.[A-Za-z]{1,3})?$/.test(trimmed)) {
    return trimmed.toUpperCase()
  }

  // Try to pull a parenthesised ticker, e.g. "Vanguard Australian Shares (VAS)".
  const paren = trimmed.match(/\(([A-Za-z]{1,6}(?:\.[A-Za-z]{1,3})?)\)/)
  if (paren) return paren[1].toUpperCase()

  return ''
}
