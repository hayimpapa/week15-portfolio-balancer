import { useRef, useState } from 'react'
import { parseAllocationCsv, sampleAllocationCsv } from '../lib/csv.js'

export default function TargetAllocationUpload({ onLoaded }) {
  const inputRef = useRef(null)
  const [errors, setErrors] = useState([])
  const [warnings, setWarnings] = useState([])
  const [dragging, setDragging] = useState(false)

  function handleText(text) {
    const result = parseAllocationCsv(text)
    setErrors(result.errors)
    setWarnings(result.warnings)
    if (result.errors.length === 0 && result.rows.length > 0) {
      onLoaded(result.rows)
    }
  }

  function handleFile(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => handleText(String(e.target.result))
    reader.onerror = () => setErrors(['Could not read that file.'])
    reader.readAsText(file)
  }

  function downloadSample() {
    const blob = new Blob([sampleAllocationCsv()], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'target-allocation-sample.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">1 · Upload Target Allocation</h2>
        <button className="btn-ghost text-xs" onClick={downloadSample}>
          Download sample CSV
        </button>
      </div>
      <div className="card-body space-y-4">
        <p className="text-sm text-ink-500">
          Upload a CSV with <code className="rounded bg-slate-100 px-1">asset_type</code> and{' '}
          <code className="rounded bg-slate-100 px-1">percentage</code> columns. Percentages may be
          written as <span className="font-medium">80</span>, <span className="font-medium">0.8</span>, or{' '}
          <span className="font-medium">80%</span> — they must total 100%.
        </p>

        <div
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
            dragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50'
          }`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            handleFile(e.dataTransfer.files?.[0])
          }}
        >
          <svg viewBox="0 0 24 24" className="mb-3 h-10 w-10 text-brand-500" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 16V4m0 0L8 8m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-sm font-medium text-ink-700">Drag & drop your CSV here</p>
          <p className="mb-4 text-xs text-ink-500">or</p>
          <button className="btn-primary" onClick={() => inputRef.current?.click()}>
            Choose file
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>

        {errors.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <p className="mb-1 font-semibold">Couldn&apos;t use this file:</p>
            <ul className="list-inside list-disc space-y-0.5">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}
        {warnings.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            <ul className="list-inside list-disc space-y-0.5">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
