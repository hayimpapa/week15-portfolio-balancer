import { useState } from 'react'
import { formatCurrency, formatNumber, formatTimeAgo } from '../lib/format.js'
import { holdingValue } from '../lib/rebalance.js'

function PriceCell({ holding, onRefresh, onManualPrice }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  if (holding.priceStatus === 'loading') {
    return (
      <span className="inline-flex items-center gap-1.5 text-ink-500">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-brand-500" />
        Fetching…
      </span>
    )
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <input
          autoFocus
          type="number"
          step="any"
          min="0"
          className="input h-8 w-24 py-1"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onManualPrice(Number(draft))
              setEditing(false)
            }
            if (e.key === 'Escape') setEditing(false)
          }}
        />
        <button
          className="btn-ghost h-8 px-2 py-1 text-xs"
          onClick={() => {
            onManualPrice(Number(draft))
            setEditing(false)
          }}
        >
          Save
        </button>
      </span>
    )
  }

  const hasPrice = holding.unitPrice != null && !Number.isNaN(Number(holding.unitPrice))

  return (
    <span className="group inline-flex items-center gap-1.5">
      <span className={hasPrice ? 'tabular-nums text-ink-900' : 'text-ink-400'}>
        {hasPrice ? formatCurrency(Number(holding.unitPrice)) : 'N/A'}
      </span>
      {holding.priceStatus === 'error' && (
        <span title={holding.priceError || 'Price unavailable'} className="text-amber-500">
          ⚠
        </span>
      )}
      {holding.priceStale && !holding.priceError && (
        <span title="Showing last known price" className="text-amber-500">
          •
        </span>
      )}
      <button
        className="btn-ghost h-6 px-1 py-0 text-xs opacity-0 transition group-hover:opacity-100 no-print"
        title="Refresh price"
        onClick={onRefresh}
      >
        ⟳
      </button>
      <button
        className="btn-ghost h-6 px-1 py-0 text-xs opacity-0 transition group-hover:opacity-100 no-print"
        title="Enter price manually"
        onClick={() => {
          setDraft(hasPrice ? String(holding.unitPrice) : '')
          setEditing(true)
        }}
      >
        ✎
      </button>
    </span>
  )
}

export default function HoldingsTable({ holdings, totalValue, onEdit, onDelete, onRefreshPrice, onManualPrice, onRefreshAll }) {
  if (holdings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-ink-500">
        No holdings yet. Add your first asset above to get started.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between no-print">
        <span className="text-xs text-ink-500">{holdings.length} holding{holdings.length === 1 ? '' : 's'}</span>
        <button className="btn-ghost text-xs" onClick={onRefreshAll}>
          ⟳ Refresh all prices
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-ink-500">
              <th className="pb-2 font-medium">Asset</th>
              <th className="pb-2 font-medium">Asset Type</th>
              <th className="pb-2 text-right font-medium">Quantity</th>
              <th className="pb-2 text-right font-medium">Unit Price</th>
              <th className="pb-2 text-right font-medium">Total Value</th>
              <th className="pb-2 text-right font-medium no-print">Actions</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => (
              <tr key={h.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                <td className="py-3">
                  <div className="font-medium text-ink-900">{h.assetName}</div>
                  {h.ticker && <div className="text-xs text-ink-500">{h.ticker}</div>}
                </td>
                <td className="py-3">
                  <span className="badge bg-slate-100 text-ink-700">{h.assetType}</span>
                </td>
                <td className="py-3 text-right tabular-nums text-ink-700">{formatNumber(h.quantity, 4)}</td>
                <td className="py-3 text-right">
                  <PriceCell
                    holding={h}
                    onRefresh={() => onRefreshPrice(h.id)}
                    onManualPrice={(price) => onManualPrice(h.id, price)}
                  />
                  {h.fetchedAt && (
                    <div className="text-[10px] text-ink-400">{formatTimeAgo(h.fetchedAt)}</div>
                  )}
                </td>
                <td className="py-3 text-right font-semibold tabular-nums text-ink-900">
                  {formatCurrency(holdingValue(h))}
                </td>
                <td className="py-3 text-right no-print">
                  <div className="inline-flex gap-1">
                    <button className="btn-ghost h-7 px-2 py-1 text-xs" onClick={() => onEdit(h.id)}>
                      Edit
                    </button>
                    <button
                      className="btn-ghost h-7 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      onClick={() => onDelete(h.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200">
              <td colSpan={4} className="pt-3 font-semibold text-ink-700">
                Total Portfolio Value
              </td>
              <td className="pt-3 text-right text-base font-bold tabular-nums text-ink-900">
                {formatCurrency(totalValue)}
              </td>
              <td className="no-print" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
