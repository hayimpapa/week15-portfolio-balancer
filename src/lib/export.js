// PDF + CSV export helpers.
import { holdingValue } from './rebalance.js'

export async function exportElementToPdf(element, filename = 'portfolio-snapshot.pdf') {
  if (!element) throw new Error('Nothing to export')
  // Lazy-load the heavy PDF toolchain only when the user actually exports.
  const { default: html2pdf } = await import('html2pdf.js')
  const opts = {
    margin: [10, 10, 10, 10],
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] },
  }
  return html2pdf().set(opts).from(element).save()
}

function csvEscape(value) {
  const str = String(value ?? '')
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

export function exportHoldingsToCsv(holdings, filename = 'holdings.csv') {
  const header = ['asset_name', 'ticker', 'asset_type', 'quantity', 'unit_price', 'total_value']
  const lines = [header.join(',')]
  for (const h of holdings) {
    lines.push(
      [
        h.assetName,
        h.ticker || '',
        h.assetType,
        h.quantity,
        h.unitPrice ?? '',
        holdingValue(h).toFixed(2),
      ]
        .map(csvEscape)
        .join(','),
    )
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
