// CSV parsing and percentage normalization for target allocations.

export const SUM_TOLERANCE = 0.1 // percentage points

/**
 * Normalize a percentage string/number into a percentage value (0-100).
 * Accepts: "80", 80, "0.8", "80%", " 80 % ".
 *
 * Rules:
 *  - If the value contains a "%" sign, it is treated as a literal percent ("80%" -> 80).
 *  - Otherwise, values <= 1 are treated as fractions ("0.8" -> 80, "1" -> 100).
 *  - Otherwise the number is taken literally ("80" -> 80).
 *
 * Returns a Number, or NaN if it can't be parsed.
 */
export function parsePercentage(raw) {
  if (raw == null) return NaN
  const str = String(raw).trim()
  if (str === '') return NaN

  const hasPercent = str.includes('%')
  const cleaned = str.replace(/%/g, '').replace(/,/g, '').trim()
  const num = Number(cleaned)
  if (Number.isNaN(num)) return NaN

  if (hasPercent) return num
  if (num > 0 && num <= 1) return num * 100
  return num
}

/**
 * Very small, dependency-free CSV line splitter that supports quoted fields
 * and escaped quotes ("").
 */
function splitCsvLine(line) {
  const fields = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      fields.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current)
  return fields.map((f) => f.trim())
}

/** Find the index of a header from a list of acceptable aliases. */
function findColumn(headers, aliases) {
  const lower = headers.map((h) => h.toLowerCase().replace(/[\s_-]+/g, ''))
  for (const alias of aliases) {
    const idx = lower.indexOf(alias)
    if (idx !== -1) return idx
  }
  return -1
}

/**
 * Parse a target-allocation CSV.
 * Returns { rows, errors, warnings, total } where rows is an array of
 * { assetType, targetPercentage }.
 */
export function parseAllocationCsv(text) {
  const errors = []
  const warnings = []

  const lines = String(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  if (lines.length === 0) {
    return { rows: [], errors: ['The file is empty.'], warnings, total: 0 }
  }

  const header = splitCsvLine(lines[0])
  const typeIdx = findColumn(header, ['assettype', 'asset', 'type', 'category', 'class', 'name'])
  const pctIdx = findColumn(header, [
    'percentage',
    'percent',
    'pct',
    'target',
    'targetpercentage',
    'allocation',
    'weight',
  ])

  if (typeIdx === -1 || pctIdx === -1) {
    errors.push(
      'CSV must include an "asset_type" column and a "percentage" column. ' +
        `Found headers: ${header.join(', ') || '(none)'}.`,
    )
    return { rows: [], errors, warnings, total: 0 }
  }

  const rows = []
  const seen = new Map()
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i])
    const assetType = (cells[typeIdx] || '').trim()
    const rawPct = cells[pctIdx]
    if (assetType === '' && (rawPct == null || String(rawPct).trim() === '')) {
      continue // skip fully blank rows
    }
    if (assetType === '') {
      warnings.push(`Row ${i + 1}: missing asset type — skipped.`)
      continue
    }
    const pct = parsePercentage(rawPct)
    if (Number.isNaN(pct)) {
      errors.push(`Row ${i + 1} ("${assetType}"): "${rawPct}" is not a valid percentage.`)
      continue
    }
    if (pct < 0) {
      errors.push(`Row ${i + 1} ("${assetType}"): percentage cannot be negative.`)
      continue
    }
    if (seen.has(assetType.toLowerCase())) {
      // Merge duplicates by summing.
      const existing = seen.get(assetType.toLowerCase())
      existing.targetPercentage += pct
      warnings.push(`Duplicate asset type "${assetType}" merged.`)
      continue
    }
    const row = { assetType, targetPercentage: pct }
    seen.set(assetType.toLowerCase(), row)
    rows.push(row)
  }

  const total = rows.reduce((sum, r) => sum + r.targetPercentage, 0)

  if (rows.length === 0 && errors.length === 0) {
    errors.push('No valid allocation rows were found.')
  }

  if (rows.length > 0 && Math.abs(total - 100) > SUM_TOLERANCE) {
    errors.push(
      `Target percentages must sum to 100% (±${SUM_TOLERANCE}%). ` +
        `Your file sums to ${total.toFixed(2)}%.`,
    )
  }

  return { rows, errors, warnings, total }
}

/** Build a small sample CSV users can download to get started. */
export function sampleAllocationCsv() {
  return [
    'asset_type,percentage',
    'Australian Shares,40%',
    'International Shares,30%',
    'US Shares,15%',
    'Bonds,10%',
    'Cash,5%',
  ].join('\n')
}
