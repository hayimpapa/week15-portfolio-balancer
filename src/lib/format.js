// Formatting helpers used throughout the app.

const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const currencyWholeFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function formatCurrency(value, { whole = false } = {}) {
  if (value == null || Number.isNaN(value)) return '—'
  return (whole ? currencyWholeFmt : currencyFmt).format(value)
}

export function formatPercent(value, digits = 1) {
  if (value == null || Number.isNaN(value)) return '—'
  return `${value.toFixed(digits)}%`
}

// e.g. -5 -> "-5.0%", 3 -> "+3.0%"
export function formatSignedPercent(value, digits = 1) {
  if (value == null || Number.isNaN(value)) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(digits)}%`
}

export function formatNumber(value, digits = 2) {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatTimeAgo(timestamp) {
  if (!timestamp) return ''
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
