import { useState } from 'react'
import { PROVIDERS, getConfig, setConfig, clearPriceCache } from '../lib/priceService.js'

export default function SettingsPanel({ open, onClose, onChanged }) {
  const [config, setLocalConfig] = useState(getConfig)
  const [saved, setSaved] = useState(false)

  if (!open) return null

  const provider = PROVIDERS[config.provider] || PROVIDERS.demo

  function save() {
    setConfig(config)
    setSaved(true)
    onChanged?.(config)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end no-print" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-50 flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-ink-900">Price API Settings</h2>
          <button className="btn-ghost" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div>
            <label className="label">Price Provider</label>
            <select
              className="input"
              value={config.provider}
              onChange={(e) => setLocalConfig({ ...config, provider: e.target.value })}
            >
              {Object.entries(PROVIDERS).map(([key, p]) => (
                <option key={key} value={key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {provider.needsKey && (
            <div>
              <label className="label">API Key</label>
              <input
                className="input"
                type="password"
                placeholder="Paste your free API key"
                value={config.apiKey}
                onChange={(e) => setLocalConfig({ ...config, apiKey: e.target.value })}
              />
              <p className="mt-1 text-xs text-ink-500">
                {config.provider === 'alphavantage' && (
                  <>
                    Get a free key at{' '}
                    <a
                      className="text-brand-600 underline"
                      href="https://www.alphavantage.co/support/#api-key"
                      target="_blank"
                      rel="noreferrer"
                    >
                      alphavantage.co
                    </a>
                    . Free tier is limited to ~25 requests/day.
                  </>
                )}
                {config.provider === 'finnhub' && (
                  <>
                    Get a free key at{' '}
                    <a
                      className="text-brand-600 underline"
                      href="https://finnhub.io/register"
                      target="_blank"
                      rel="noreferrer"
                    >
                      finnhub.io
                    </a>
                    .
                  </>
                )}
              </p>
            </div>
          )}

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-ink-600">
            <p className="mb-1 font-semibold text-ink-700">About the providers</p>
            <ul className="list-inside list-disc space-y-1">
              <li>
                <strong>Demo</strong> — deterministic offline prices. Great for trying the app with no
                setup.
              </li>
              <li>
                <strong>Yahoo Finance</strong> — no key, routed via a public CORS proxy. Can be flaky or
                rate-limited.
              </li>
              <li>
                <strong>Alpha Vantage / Finnhub</strong> — reliable real prices with a free API key.
              </li>
            </ul>
            <p className="mt-2">
              Prices are cached locally for 10 minutes. If a fetch fails, the app keeps the last known
              price and you can always enter prices manually.
            </p>
          </div>

          <button
            className="btn-ghost text-xs text-red-600"
            onClick={() => {
              clearPriceCache()
              setSaved(true)
              setTimeout(() => setSaved(false), 1500)
            }}
          >
            Clear price cache
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
          {saved && <span className="text-sm text-green-600">Saved ✓</span>}
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn-primary" onClick={save}>
            Save settings
          </button>
        </div>
      </div>
    </div>
  )
}
