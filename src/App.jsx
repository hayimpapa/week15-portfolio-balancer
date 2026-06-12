import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import TopNav from './components/TopNav.jsx'
import AboutThisBuild from './components/AboutThisBuild.jsx'
import Header from './components/Header.jsx'
import TargetAllocationUpload from './components/TargetAllocationUpload.jsx'
import TargetAllocationTable from './components/TargetAllocationTable.jsx'
import HoldingsForm from './components/HoldingsForm.jsx'
import HoldingsTable from './components/HoldingsTable.jsx'
import RebalancingSuggestions from './components/RebalancingSuggestions.jsx'
import { AllocationPieChart, ComparisonBarChart } from './components/Charts.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import { analyzePortfolio } from './lib/rebalance.js'
import { fetchPrice, getCachedPrice } from './lib/priceService.js'
import { loadJSON, saveJSON } from './lib/storage.js'
import { exportElementToPdf, exportHoldingsToCsv } from './lib/export.js'

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export default function App() {
  const [targets, setTargets] = useState(() => loadJSON('targets', []))
  const [holdings, setHoldings] = useState(() => loadJSON('holdings', []))
  const [editingId, setEditingId] = useState(null)
  const [activeTab, setActiveTab] = useState('rebalancer')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const reportRef = useRef(null)

  const assetTypes = useMemo(() => targets.map((t) => t.assetType), [targets])

  // Persist to localStorage.
  useEffect(() => saveJSON('targets', targets), [targets])
  useEffect(() => saveJSON('holdings', holdings), [holdings])

  const analysis = useMemo(() => analyzePortfolio(holdings, targets), [holdings, targets])

  const updateHolding = useCallback((id, patch) => {
    setHoldings((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h)))
  }, [])

  // Fetch a price for a holding and merge the result into state.
  const refreshPrice = useCallback(
    async (id, ticker, force = false) => {
      const symbol = ticker
      if (!symbol) {
        updateHolding(id, { priceStatus: 'error', priceError: 'No ticker for lookup' })
        return
      }
      updateHolding(id, { priceStatus: 'loading', priceError: null })
      const result = await fetchPrice(symbol, { force })
      if (result.price == null) {
        updateHolding(id, {
          priceStatus: 'error',
          priceError: result.error || 'Price unavailable',
          priceStale: false,
        })
      } else {
        updateHolding(id, {
          unitPrice: result.price,
          fetchedAt: result.fetchedAt,
          priceStatus: 'ok',
          priceError: result.error || null,
          priceStale: Boolean(result.stale),
        })
      }
    },
    [updateHolding],
  )

  function handleAddOrEdit(data) {
    if (editingId) {
      const existing = holdings.find((h) => h.id === editingId)
      const tickerChanged = existing && existing.ticker !== data.ticker
      updateHolding(editingId, data)
      if (tickerChanged) refreshPrice(editingId, data.ticker, true)
      setEditingId(null)
    } else {
      const id = uid()
      // Seed with cached price if we have one, so the row isn't empty.
      const cached = getCachedPrice(data.ticker)
      const holding = {
        id,
        ...data,
        unitPrice: cached?.price ?? null,
        fetchedAt: cached?.fetchedAt ?? null,
        priceStatus: 'idle',
      }
      setHoldings((prev) => [...prev, holding])
      refreshPrice(id, data.ticker)
    }
  }

  function handleManualPrice(id, price) {
    if (Number.isNaN(price) || price < 0) return
    updateHolding(id, {
      unitPrice: price,
      fetchedAt: Date.now(),
      priceStatus: 'ok',
      priceError: null,
      priceStale: false,
    })
  }

  function refreshAllPrices() {
    holdings.forEach((h) => refreshPrice(h.id, h.ticker, true))
  }

  function clearTargets() {
    if (
      holdings.length > 0 &&
      !window.confirm('Clear the target allocation? Your holdings will be kept.')
    )
      return
    setTargets([])
  }

  const editing = editingId ? holdings.find((h) => h.id === editingId) : null
  const hasTargets = targets.length > 0
  const canExport = hasTargets && holdings.length > 0

  async function handleExportPdf() {
    if (!reportRef.current) return
    setExporting(true)
    try {
      await exportElementToPdf(reportRef.current, 'portfolio-rebalancer-snapshot.pdf')
    } catch (err) {
      alert('PDF export failed: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <TopNav activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'about' ? (
          <AboutThisBuild />
        ) : (
          <>
            <Header
              totalValue={analysis.totalValue}
              hasData={canExport}
              onOpenSettings={() => setSettingsOpen(true)}
              onExport={handleExportPdf}
              canExport={canExport && !exporting}
            />

            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {!hasTargets ? (
          <div className="mx-auto max-w-2xl">
            <TargetAllocationUpload onLoaded={setTargets} />
            <p className="mt-4 text-center text-sm text-ink-500">
              Start by uploading your target asset allocation. Everything else unlocks from there.
            </p>
          </div>
        ) : (
          <div ref={reportRef} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left: target + add form */}
              <div className="space-y-6 lg:col-span-1">
                <TargetAllocationTable targets={targets} onClear={clearTargets} />
                <div className="card no-print">
                  <div className="card-header">
                    <h2 className="card-title">
                      {editing ? 'Edit Holding' : '2 · Add a Holding'}
                    </h2>
                  </div>
                  <div className="card-body">
                    <HoldingsForm
                      assetTypes={assetTypes}
                      onSubmit={handleAddOrEdit}
                      editing={editing}
                      onCancelEdit={() => setEditingId(null)}
                    />
                  </div>
                </div>
              </div>

              {/* Right: holdings + suggestions */}
              <div className="space-y-6 lg:col-span-2">
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Current Holdings</h2>
                    {holdings.length > 0 && (
                      <button
                        className="btn-ghost text-xs no-print"
                        onClick={() => exportHoldingsToCsv(holdings)}
                      >
                        Export CSV
                      </button>
                    )}
                  </div>
                  <div className="card-body">
                    <HoldingsTable
                      holdings={holdings}
                      totalValue={analysis.totalValue}
                      onEdit={setEditingId}
                      onDelete={(id) => {
                        setHoldings((prev) => prev.filter((h) => h.id !== id))
                        if (editingId === id) setEditingId(null)
                      }}
                      onRefreshPrice={(id) => {
                        const h = holdings.find((x) => x.id === id)
                        if (h) refreshPrice(id, h.ticker, true)
                      }}
                      onManualPrice={handleManualPrice}
                      onRefreshAll={refreshAllPrices}
                    />
                  </div>
                </div>

                <RebalancingSuggestions analysis={analysis} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <AllocationPieChart byType={analysis.byType} totalValue={analysis.totalValue} />
              <ComparisonBarChart byType={analysis.byType} />
            </div>
          </div>
              )}
            </main>

            <footer className="mx-auto max-w-7xl px-4 py-8 text-center text-xs text-ink-400 sm:px-6 no-print">
              Portfolio Rebalancer · Prices are indicative and may be delayed. Not financial advice.
            </footer>

            <SettingsPanel
              open={settingsOpen}
              onClose={() => setSettingsOpen(false)}
              onChanged={() => refreshAllPrices()}
            />
          </>
        )}
      </div>
    </div>
  )
}
