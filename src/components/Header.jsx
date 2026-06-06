import { formatCurrency } from '../lib/format.js'

export default function Header({ totalValue, hasData, onOpenSettings, onExport, canExport }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur no-print">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M4 16l4-5 3 3 6-8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="20" cy="6" r="1.6" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-ink-900">Portfolio Rebalancer</h1>
            <p className="hidden text-xs text-ink-500 sm:block">
              Align your holdings with your target asset allocation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {hasData && (
            <div className="hidden text-right sm:block">
              <div className="text-xs uppercase tracking-wide text-ink-500">Portfolio value</div>
              <div className="text-lg font-semibold tabular-nums text-ink-900">
                {formatCurrency(totalValue)}
              </div>
            </div>
          )}
          <button className="btn-secondary" onClick={onExport} disabled={!canExport} title="Export a PDF snapshot">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">Export</span>
          </button>
          <button className="btn-ghost" onClick={onOpenSettings} title="Price API settings">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 008 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H2a2 2 0 110-4h.09A1.65 1.65 0 004.6 8a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V2a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H22a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
