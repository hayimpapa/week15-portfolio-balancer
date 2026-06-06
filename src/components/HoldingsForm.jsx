import { useEffect, useMemo, useState } from 'react'
import { suggestAssetType, detectTicker } from '../lib/classify.js'

const EMPTY = { assetName: '', ticker: '', quantity: '', assetType: '', manualType: false }

export default function HoldingsForm({ assetTypes, onSubmit, editing, onCancelEdit }) {
  const [form, setForm] = useState(EMPTY)

  // Load a holding into the form when editing begins.
  useEffect(() => {
    if (editing) {
      setForm({
        assetName: editing.assetName || '',
        ticker: editing.ticker || '',
        quantity: String(editing.quantity ?? ''),
        assetType: editing.assetType || '',
        manualType: true,
      })
    }
  }, [editing])

  // Live asset-type suggestion based on the current name/ticker.
  const suggestion = useMemo(() => {
    if (!form.assetName.trim() && !form.ticker.trim()) return null
    return suggestAssetType(form.assetName, form.ticker, assetTypes)
  }, [form.assetName, form.ticker, assetTypes])

  // Auto-apply the suggestion until the user manually picks a type.
  const effectiveType =
    form.manualType && form.assetType ? form.assetType : suggestion?.assetType || form.assetType || ''

  function update(patch) {
    setForm((f) => ({ ...f, ...patch }))
  }

  function handleNameBlur() {
    if (!form.ticker.trim()) {
      const detected = detectTicker(form.assetName)
      if (detected) update({ ticker: detected })
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const quantity = Number(form.quantity)
    if (!form.assetName.trim() || Number.isNaN(quantity) || quantity <= 0) return
    onSubmit({
      assetName: form.assetName.trim(),
      ticker: (form.ticker.trim() || detectTicker(form.assetName)).toUpperCase(),
      quantity,
      assetType: effectiveType || assetTypes[0],
    })
    setForm(EMPTY)
  }

  const isEditing = Boolean(editing)
  const usingSuggestion = !form.manualType && suggestion?.assetType

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Asset Name</label>
          <input
            className="input"
            placeholder="e.g. VAS or Vanguard Australian Shares"
            value={form.assetName}
            onChange={(e) => update({ assetName: e.target.value })}
            onBlur={handleNameBlur}
            required
          />
        </div>
        <div>
          <label className="label">
            Ticker <span className="font-normal normal-case text-ink-300">(for price lookup)</span>
          </label>
          <input
            className="input"
            placeholder="e.g. VAS.AX"
            value={form.ticker}
            onChange={(e) => update({ ticker: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Quantity / Units</label>
          <input
            className="input"
            type="number"
            min="0"
            step="any"
            placeholder="e.g. 55"
            value={form.quantity}
            onChange={(e) => update({ quantity: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Asset Type</label>
          <select
            className="input"
            value={effectiveType}
            onChange={(e) => update({ assetType: e.target.value, manualType: true })}
          >
            {assetTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {usingSuggestion && (
            <p className="mt-1 text-xs text-brand-600">
              Suggested from name — change above if needed.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="submit" className="btn-primary">
          {isEditing ? 'Save changes' : 'Add holding'}
        </button>
        {isEditing && (
          <button type="button" className="btn-secondary" onClick={onCancelEdit}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
