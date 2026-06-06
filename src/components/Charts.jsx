import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { colorForIndex } from '../lib/rebalance.js'
import { formatCurrency, formatPercent } from '../lib/format.js'

function EmptyChart({ message }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-ink-400">
      {message}
    </div>
  )
}

export function AllocationPieChart({ byType, totalValue }) {
  const data = byType
    .filter((b) => b.value > 0)
    .map((b, i) => ({ name: b.assetType, value: b.value, pct: b.currentPercentage, color: colorForIndex(i) }))

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Current Allocation</h2>
      </div>
      <div className="card-body">
        {data.length === 0 || totalValue === 0 ? (
          <EmptyChart message="Add holdings with prices to see your allocation." />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                label={({ pct }) => formatPercent(pct, 0)}
                labelLine={false}
                isAnimationActive={false}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name, props) => [
                  `${formatCurrency(value)} (${formatPercent(props.payload.pct)})`,
                  name,
                ]}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                formatter={(value, entry) => (
                  <span className="text-xs text-ink-700">
                    {value} · {formatPercent(entry.payload.pct)}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export function ComparisonBarChart({ byType }) {
  const data = byType
    .filter((b) => b.inTarget || b.value > 0)
    .map((b) => ({
      name: b.assetType,
      Current: Number(b.currentPercentage.toFixed(2)),
      Target: Number(b.targetPercentage.toFixed(2)),
    }))

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Current vs Target</h2>
      </div>
      <div className="card-body">
        {data.length === 0 ? (
          <EmptyChart message="Upload a target and add holdings to compare." />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b' }}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Current" fill="#1e6fd9" radius={[3, 3, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="Target" fill="#94a3b8" radius={[3, 3, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
