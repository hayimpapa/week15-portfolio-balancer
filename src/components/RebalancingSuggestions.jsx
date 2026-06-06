import { formatCurrency, formatPercent, formatSignedPercent } from '../lib/format.js'
import { STATUS_COLORS } from '../lib/rebalance.js'

const STATUS_STYLES = {
  'on-target': { badge: 'bg-green-100 text-green-700', label: 'On target' },
  minor: { badge: 'bg-amber-100 text-amber-700', label: 'Minor drift' },
  major: { badge: 'bg-red-100 text-red-700', label: 'Major drift' },
}

function SuggestionBanner({ suggestion }) {
  if (!suggestion) return null

  if (suggestion.type === 'balanced') {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
            ✓
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800">Portfolio balanced</p>
            <p className="text-sm text-green-700">{suggestion.message}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 19V5m0 0l-6 6m6-6l6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            Next investment
          </p>
          <p className="text-lg font-bold leading-tight text-ink-900">
            Invest {formatCurrency(suggestion.amount, { whole: true })} in {suggestion.assetType}
          </p>
          <p className="mt-0.5 text-sm text-ink-600">
            Currently {formatPercent(suggestion.currentPercentage)} vs target{' '}
            {formatPercent(suggestion.targetPercentage)} ({formatSignedPercent(suggestion.variance)}).
          </p>
          {suggestion.alsoUnderweight?.length > 0 && (
            <p className="mt-1 text-xs text-ink-500">
              Also underweight: {suggestion.alsoUnderweight.join(', ')}.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function RebalancingSuggestions({ analysis }) {
  const { byType, suggestion } = analysis

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Rebalancing Suggestions</h2>
      </div>
      <div className="card-body space-y-4">
        <SuggestionBanner suggestion={suggestion} />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-ink-500">
                <th className="pb-2 font-medium">Asset Type</th>
                <th className="pb-2 text-right font-medium">Current</th>
                <th className="pb-2 text-right font-medium">Target</th>
                <th className="pb-2 text-right font-medium">Variance</th>
                <th className="pb-2 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {byType.map((row) => {
                const style = STATUS_STYLES[row.status]
                return (
                  <tr key={row.assetType} className="border-b border-slate-100">
                    <td className="py-2.5">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: STATUS_COLORS[row.status] }}
                        />
                        <span className="font-medium text-ink-900">{row.assetType}</span>
                        {!row.inTarget && (
                          <span className="badge bg-slate-100 text-ink-500">not in target</span>
                        )}
                      </span>
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-ink-700">
                      {formatPercent(row.currentPercentage)}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-ink-700">
                      {formatPercent(row.targetPercentage)}
                    </td>
                    <td
                      className="py-2.5 text-right font-semibold tabular-nums"
                      style={{ color: STATUS_COLORS[row.status] }}
                    >
                      {formatSignedPercent(row.variance)}
                    </td>
                    <td className="py-2.5 text-right">
                      <span className={`badge ${style.badge}`}>{style.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-ink-400">
          Color coding: green within ±2% of target, amber within ±5%, red beyond ±5%.
        </p>
      </div>
    </div>
  )
}
