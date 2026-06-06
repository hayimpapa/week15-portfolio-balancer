import { formatPercent } from '../lib/format.js'
import { colorForIndex } from '../lib/rebalance.js'

export default function TargetAllocationTable({ targets, onClear }) {
  const total = targets.reduce((s, t) => s + t.targetPercentage, 0)

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Target Allocation</h2>
        <button className="btn-ghost text-xs no-print" onClick={onClear}>
          Clear &amp; upload new
        </button>
      </div>
      <div className="card-body">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ink-500">
              <th className="pb-2 font-medium">Asset Type</th>
              <th className="pb-2 text-right font-medium">Target</th>
              <th className="hidden pb-2 pl-4 font-medium sm:table-cell">Weight</th>
            </tr>
          </thead>
          <tbody>
            {targets.map((t, i) => (
              <tr key={t.assetType} className="border-t border-slate-100">
                <td className="py-2.5">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-3 w-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: colorForIndex(i) }}
                    />
                    <span className="font-medium text-ink-900">{t.assetType}</span>
                  </span>
                </td>
                <td className="py-2.5 text-right font-semibold tabular-nums text-ink-900">
                  {formatPercent(t.targetPercentage)}
                </td>
                <td className="hidden py-2.5 pl-4 sm:table-cell">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, t.targetPercentage)}%`,
                        backgroundColor: colorForIndex(i),
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200">
              <td className="pt-2.5 font-semibold text-ink-700">Total</td>
              <td className="pt-2.5 text-right font-bold tabular-nums text-ink-900">
                {formatPercent(total)}
              </td>
              <td className="hidden sm:table-cell" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
